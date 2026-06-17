import { NextRequest, NextResponse } from 'next/server';
import { processMessage } from '@/lib/agent';
import { createConversation, getConversation, addMessage, updateConversation } from '@/lib/crm/store';
import { ConversationMessage } from '@/lib/agent/types';
import { generateId } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, customerId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get or create conversation
    let state = conversationId ? getConversation(conversationId) : null;
    if (!state) {
      state = createConversation(customerId || null);
    }

    // Update customer ID if provided
    if (customerId && state.customerId !== customerId) {
      updateConversation(state.conversationId, { customerId });
      state.customerId = customerId;
    }

    // Add user message
    const userMsg: ConversationMessage = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    addMessage(state.conversationId, userMsg);

    // Process with agent
    const startTime = Date.now();
    const result = await processMessage(state, message);
    const responseTime = Date.now() - startTime;

    // Add agent response
    const agentMsg: ConversationMessage = {
      id: generateId(),
      role: 'agent',
      content: result.agentResponse,
      timestamp: new Date().toISOString(),
      metadata: {
        decision: result.decision || undefined,
        reasoningSteps: result.reasoningSteps,
      },
    };
    addMessage(state.conversationId, agentMsg);

    return NextResponse.json({
      conversationId: state.conversationId,
      message: result.agentResponse,
      decision: result.decision,
      reasoningSteps: result.reasoningSteps,
      responseTime,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message', details: error.message },
      { status: 500 }
    );
  }
}
