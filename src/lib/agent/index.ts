import { AgentDecision, AgentState, ConversationMessage, ReasoningStep, RefundStatus } from './types';
import { lookupCustomer, validatePolicy, calculateFraudScore, escalateToHuman, retrieveKnowledgeBase } from './tools';
import { REFUND_POLICY } from './policy';
import { callGroq } from '@/lib/groq';
import { getCustomerById } from '@/lib/crm/data';
import { addMessage, addReasoningStep, updateConversation, updateStats, getStats, incrementDenials } from '@/lib/crm/store';
import { generateId } from '@/lib/utils';

const SYSTEM_PROMPT = `You are an AI Customer Support Agent for ShopSmart E-Commerce. Your role is to process refund requests professionally and firmly while following strict company policy.

## Your Personality
- Professional, empathetic but firm
- You understand customer frustration but cannot bend the rules
- You always offer alternatives when denying a refund
- You never reveal internal fraud scores or policy rule names to customers
- You speak in a warm but professional tone

## Refund Policy Summary
${REFUND_POLICY}

## Response Guidelines
- Acknowledge the customer's concern
- Explain the decision clearly without revealing internal systems
- If denying: offer store credit (110% value), exchange, or discount on next purchase
- If the customer is upset after a denial, remain calm and firm ("hold the line")
- After 3 consecutive denials for the same request, offer to escalate to a human supervisor
- For VIP customers, be extra courteous and mention their valued status

## IMPORTANT
- You MUST respond with a JSON object containing your decision and response
- Format: { "decision": { "status": "approved|denied|partial|store_credit|escalated", "amount": number, "reasoning": "internal reasoning", "confidence": 0.0-1.0, "alternatives": ["alt1", "alt2"], "requiresEscalation": boolean }, "response": "customer-facing message", "internalNotes": "notes for admin dashboard" }`;

export async function processMessage(
  conversationState: AgentState,
  userMessage: string
): Promise<{ agentResponse: string; decision: AgentDecision | null; reasoningSteps: ReasoningStep[] }> {
  const steps: ReasoningStep[] = [];
  const conversationId = conversationState.conversationId;

  // Step 1: Thinking - Analyze the user message
  const thinkingStep: ReasoningStep = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    tool: 'thinking',
    input: { userMessage },
    output: { analysis: 'Analyzing customer request...' },
    duration: 0,
    status: 'running',
  };
  addReasoningStep(conversationId, thinkingStep);

  // Step 2: If customer ID is set, look up customer and run fraud check
  let customerData = null;
  let fraudData = null;
  let policyData = null;
  let ragData = null;

  // Retrieve context from knowledge base (RAG)
  const ragResult = await retrieveKnowledgeBase(userMessage, conversationId);
  steps.push(ragResult.reasoningStep);
  ragData = ragResult.data;

  if (conversationState.customerId) {
    // Lookup customer
    const lookupResult = await lookupCustomer(conversationState.customerId, conversationId);
    steps.push(lookupResult.reasoningStep);
    customerData = lookupResult.data;

    // Calculate fraud score
    const fraudResult = await calculateFraudScore(conversationState.customerId, conversationId);
    steps.push(fraudResult.reasoningStep);
    fraudData = fraudResult.data;

    // Detect if this is a refund request and validate policy
    const isRefundRequest = /refund|return|money back|cancel order|damaged|defective|wrong item/i.test(userMessage);

    if (isRefundRequest && customerData?.orders?.length > 0) {
      const latestOrder = customerData.orders[0];
      const hasProof = /receipt|proof|photo|screenshot|picture|image/i.test(userMessage);

      const policyResult = await validatePolicy(
        conversationState.customerId,
        latestOrder.id,
        userMessage,
        hasProof,
        latestOrder.total,
        conversationId
      );
      steps.push(policyResult.reasoningStep);
      policyData = policyResult.data;
    }
  }

  // Step 3: Build context for LLM
  const toolResults = {
    customer: customerData ? {
      name: customerData.customer.name,
      status: customerData.customer.status,
      isVIP: customerData.customer.isVIP,
      accountAgeDays: customerData.customer.accountAge,
      totalOrders: customerData.customer.totalOrders,
      totalSpent: customerData.customer.totalSpent,
      recentRefunds: customerData.customer.refundHistory.length,
      orders: customerData.orders?.map((o: any) => ({ id: o.id, total: o.total, daysSincePurchase: o.daysSincePurchase, items: o.items.map((i: any) => i.name) })),
    } : null,
    fraud: fraudData,
    knowledgeBaseInfo: ragData ? { title: ragData.title, content: ragData.content } : null,
    policy: policyData ? {
      canProcess: policyData.canProcess,
      recommendedAction: policyData.recommendedAction,
      refundPercentage: policyData.refundPercentage,
      violations: policyData.violations,
    } : null,
    conversationContext: {
      denialCount: conversationState.denialCount,
      isEscalated: conversationState.isEscalated,
      messageCount: conversationState.messages.length,
    },
  };

  // Step 4: Call LLM with full context
  const conversationHistory = conversationState.messages.slice(-10).map(m => ({
    role: m.role === 'agent' ? 'assistant' as const : 'user' as const,
    content: m.content,
  }));

  const llmMessages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...conversationHistory,
    {
      role: 'user' as const,
      content: `Customer message: "${userMessage}"

Tool Results:
${JSON.stringify(toolResults, null, 2)}

Based on the tool results and conversation history, provide your response as a JSON object.`,
    },
  ];

  let agentResponse = '';
  let decision: AgentDecision | null = null;
  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      const llmResult = await callGroq(llmMessages, { jsonMode: true, temperature: 0.3 });

      let parsed;
      try {
        const jsonMatch = llmResult.content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : llmResult.content;
        parsed = JSON.parse(jsonString);
      } catch (e) {
        throw new Error("Failed to parse JSON: " + llmResult.content);
      }
      agentResponse = parsed.message || parsed.response || 'I apologize for the technical difficulty. Let me connect you with a human agent who can assist you right away.';

      if (parsed.decision) {
        decision = {
          status: parsed.decision.status as RefundStatus,
          amount: parsed.decision.amount || 0,
          reasoning: parsed.decision.reasoning || '',
          policyViolations: policyData?.violations || [],
          confidence: parsed.decision.confidence || 0.8,
          alternatives: parsed.decision.alternatives || [],
          requiresEscalation: parsed.decision.requiresEscalation || false,
        };

        // Retry if confidence is too low
        if (decision.confidence < 0.7 && retryCount < maxRetries) {
          retryCount++;
          const retryStep: ReasoningStep = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            tool: 'thinking',
            input: { reason: 'Low confidence, retrying' },
            output: { confidence: decision.confidence, attempt: retryCount + 1 },
            duration: 0,
            status: 'running',
          };
          addReasoningStep(conversationId, retryStep);
          steps.push(retryStep);
          continue;
        }

        // Handle denial counting
        if (decision.status === 'denied') {
          const denials = incrementDenials(conversationId);

          // Auto-escalate after 3 denials
          if (denials >= 3) {
            decision.requiresEscalation = true;
            decision.status = 'escalated';
          }
        }

        // Handle VIP escalation request
        if (decision.requiresEscalation || conversationState.denialCount >= 3) {
          const customer = conversationState.customerId
            ? getCustomerById(conversationState.customerId)
            : null;

          const escalationResult = await escalateToHuman(
            conversationState.customerId || 'unknown',
            `${customer?.isVIP ? 'VIP ' : ''}Customer escalation after ${conversationState.denialCount} denials`,
            conversationId
          );
          steps.push(escalationResult.reasoningStep);

          updateConversation(conversationId, { isEscalated: true });
          const stats = getStats();
          updateStats({ escalatedCases: stats.escalatedCases + 1 });

          agentResponse += `\n\nI understand your frustration. I've escalated your case to a human supervisor (Ticket: ${escalationResult.data.ticketId}). ${escalationResult.data.estimatedWait} estimated wait time. They will have full context of our conversation.`;
        }

        // Update stats
        const currentStats = getStats();
        if (decision.status === 'approved' || decision.status === 'partial') {
          updateStats({
            approvedRefunds: currentStats.approvedRefunds + 1,
            totalRefundAmount: currentStats.totalRefundAmount + decision.amount,
            avgConfidence: ((currentStats.avgConfidence * currentStats.totalConversations) + decision.confidence) / (currentStats.totalConversations + 1),
          });
        } else if (decision.status === 'denied') {
          updateStats({
            deniedRefunds: currentStats.deniedRefunds + 1,
            avgConfidence: ((currentStats.avgConfidence * currentStats.totalConversations) + decision.confidence) / (currentStats.totalConversations + 1),
          });
        }
      }

      break; // Success, exit retry loop
    } catch (error: any) {
      console.error('Agent processing error:', error);
      if (retryCount >= maxRetries) {
        agentResponse = 'I apologize for the technical difficulty. Let me connect you with a human agent who can assist you right away.';
      }
      retryCount++;
    }
  }

  // Update thinking step as completed
  thinkingStep.status = 'completed';
  thinkingStep.output = { analysis: 'Request analysis complete', decision: decision?.status };
  thinkingStep.duration = Date.now() - new Date(thinkingStep.timestamp).getTime();

  // Decision step
  const decisionStep: ReasoningStep = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    tool: 'decision',
    input: { context: 'Final decision' },
    output: decision ? {
      status: decision.status,
      amount: decision.amount,
      confidence: decision.confidence,
      escalated: decision.requiresEscalation,
    } : { status: 'error' },
    duration: 0,
    status: 'completed',
  };
  addReasoningStep(conversationId, decisionStep);
  steps.push(decisionStep);

  // Update conversation state
  updateConversation(conversationId, { currentDecision: decision });

  return { agentResponse, decision, reasoningSteps: steps };
}
