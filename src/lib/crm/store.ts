import { AgentState, DashboardStats, FraudAlert, ConversationMessage, ReasoningStep } from '@/lib/agent/types';
import { generateId } from '@/lib/utils';

// In-memory stores
const conversations: Map<string, AgentState> = new Map();
const allReasoningSteps: ReasoningStep[] = [];
const fraudAlerts: FraudAlert[] = [];
let stats: DashboardStats = {
  totalConversations: 0,
  approvedRefunds: 0,
  deniedRefunds: 0,
  escalatedCases: 0,
  avgConfidence: 0,
  avgResponseTime: 0,
  fraudAlerts: 0,
  totalRefundAmount: 0,
};

// SSE subscribers
type SSECallback = (data: any) => void;
const subscribers: Set<SSECallback> = new Set();

export function subscribe(callback: SSECallback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function broadcast(event: string, data: any) {
  subscribers.forEach(cb => cb({ event, data, timestamp: new Date().toISOString() }));
}

export function createConversation(customerId: string | null): AgentState {
  const state: AgentState = {
    conversationId: generateId(),
    customerId,
    messages: [],
    reasoningSteps: [],
    denialCount: 0,
    currentDecision: null,
    isEscalated: false,
    startedAt: new Date().toISOString(),
  };
  conversations.set(state.conversationId, state);
  stats.totalConversations++;
  broadcast('new_conversation', { conversationId: state.conversationId, customerId });
  return state;
}

export function getConversation(id: string): AgentState | undefined {
  return conversations.get(id);
}

export function updateConversation(id: string, update: Partial<AgentState>): AgentState | undefined {
  const conv = conversations.get(id);
  if (!conv) return undefined;
  const updated = { ...conv, ...update };
  conversations.set(id, updated);
  return updated;
}

export function addMessage(conversationId: string, message: ConversationMessage) {
  const conv = conversations.get(conversationId);
  if (conv) {
    conv.messages.push(message);
    broadcast('new_message', { conversationId, message });
  }
}

export function addReasoningStep(conversationId: string, step: ReasoningStep) {
  const conv = conversations.get(conversationId);
  if (conv) {
    conv.reasoningSteps.push(step);
    allReasoningSteps.push(step);
    broadcast('reasoning_step', { conversationId, step });
  }
}

export function addFraudAlert(alert: FraudAlert) {
  fraudAlerts.unshift(alert);
  stats.fraudAlerts++;
  broadcast('fraud_alert', alert);
}

export function updateStats(update: Partial<DashboardStats>) {
  stats = { ...stats, ...update };
  broadcast('stats_update', stats);
}

export function getStats(): DashboardStats {
  return { ...stats };
}

export function getFraudAlerts(): FraudAlert[] {
  return [...fraudAlerts];
}

export function getAllReasoningSteps(): ReasoningStep[] {
  return [...allReasoningSteps].slice(-100); // last 100
}

export function getAllConversations(): AgentState[] {
  return Array.from(conversations.values());
}

export function incrementDenials(conversationId: string): number {
  const conv = conversations.get(conversationId);
  if (conv) {
    conv.denialCount++;
    return conv.denialCount;
  }
  return 0;
}
