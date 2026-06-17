import { NextResponse } from 'next/server';
import { getStats, getFraudAlerts, getAllReasoningSteps, getAllConversations } from '@/lib/crm/store';

export async function GET() {
  const stats = getStats();
  const fraudAlerts = getFraudAlerts();
  const recentSteps = getAllReasoningSteps();
  const conversations = getAllConversations();

  return NextResponse.json({
    stats,
    fraudAlerts,
    recentReasoningSteps: recentSteps.slice(-50),
    activeConversations: conversations.length,
    conversationSummaries: conversations.slice(-20).map(c => ({
      id: c.conversationId,
      customerId: c.customerId,
      messageCount: c.messages.length,
      denialCount: c.denialCount,
      isEscalated: c.isEscalated,
      decision: c.currentDecision?.status,
      startedAt: c.startedAt,
    })),
  });
}
