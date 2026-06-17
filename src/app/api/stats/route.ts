import { NextResponse } from 'next/server';
import { getStats, getFraudAlerts, getAllReasoningSteps, getAllConversations } from '@/lib/crm/store';

export const dynamic = 'force-dynamic';

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
      conversationId: c.conversationId,
      customerId: c.customerId,
      customerName: c.customerId,
      messageCount: c.messages.length,
      denialCount: c.denialCount,
      status: c.isEscalated ? 'escalated' : c.currentDecision?.status || 'active',
      lastActivity: c.startedAt,
      messages: c.messages,
    })),
  });
}
