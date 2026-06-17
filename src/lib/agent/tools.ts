import { Customer, Order, RefundRequest, PolicyViolation, FraudAlert, ReasoningStep } from './types';
import { getCustomerById, getCustomerOrders, getOrderById } from '@/lib/crm/data';
import { validateRefundPolicy } from './policy';
import { addFraudAlert, addReasoningStep } from '@/lib/crm/store';
import { generateId } from '@/lib/utils';

export interface ToolResult {
  success: boolean;
  data: any;
  reasoningStep: ReasoningStep;
}

export async function lookupCustomer(customerId: string, conversationId: string): Promise<ToolResult> {
  const startTime = Date.now();
  const customer = getCustomerById(customerId);
  const orders = customer ? getCustomerOrders(customerId) : [];

  const step: ReasoningStep = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    tool: 'lookup_customer',
    input: { customerId },
    output: customer
      ? {
          found: true,
          name: customer.name,
          status: customer.status,
          isVIP: customer.isVIP,
          accountAge: customer.accountAge,
          totalOrders: customer.totalOrders,
          totalSpent: customer.totalSpent,
          refundCount: customer.refundHistory.length,
          fraudScore: customer.fraudScore,
          orderCount: orders.length,
        }
      : { found: false },
    duration: Date.now() - startTime,
    status: 'completed',
  };

  addReasoningStep(conversationId, step);

  return {
    success: !!customer,
    data: customer ? { customer, orders } : null,
    reasoningStep: step,
  };
}

export async function validatePolicy(
  customerId: string,
  orderId: string,
  reason: string,
  hasProof: boolean,
  amount: number,
  conversationId: string
): Promise<ToolResult> {
  const startTime = Date.now();
  const customer = getCustomerById(customerId);
  const order = getOrderById(orderId);

  if (!customer) {
    const step: ReasoningStep = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      tool: 'validate_refund_policy',
      input: { customerId, orderId, reason, hasProof, amount },
      output: { error: 'Customer not found' },
      duration: Date.now() - startTime,
      status: 'error',
    };
    addReasoningStep(conversationId, step);
    return { success: false, data: null, reasoningStep: step };
  }

  const request: RefundRequest = { customerId, orderId, reason, amount, hasProof };
  const result = validateRefundPolicy(customer, order, request);

  const step: ReasoningStep = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    tool: 'validate_refund_policy',
    input: { customerId, orderId, reason, hasProof, amount },
    output: {
      canProcess: result.canProcess,
      recommendedAction: result.recommendedAction,
      refundPercentage: result.refundPercentage,
      violationCount: result.violations.length,
      violations: result.violations.map(v => ({ rule: v.rule, severity: v.severity })),
    },
    duration: Date.now() - startTime,
    status: 'completed',
  };

  addReasoningStep(conversationId, step);

  return {
    success: true,
    data: result,
    reasoningStep: step,
  };
}

export async function calculateFraudScore(customerId: string, conversationId: string): Promise<ToolResult> {
  const startTime = Date.now();
  const customer = getCustomerById(customerId);

  if (!customer) {
    const step: ReasoningStep = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      tool: 'calculate_fraud_score',
      input: { customerId },
      output: { error: 'Customer not found' },
      duration: Date.now() - startTime,
      status: 'error',
    };
    addReasoningStep(conversationId, step);
    return { success: false, data: null, reasoningStep: step };
  }

  // Fraud score factors
  const factors = {
    baseScore: customer.fraudScore,
    accountAgeRisk: customer.accountAge < 30 ? 0.15 : 0,
    refundFrequencyRisk: customer.refundHistory.length > 5 ? 0.10 : 0,
    highValueRisk: customer.totalSpent > 5000 && customer.totalOrders < 5 ? 0.1 : 0,
    emailRisk: customer.email.includes('tempmail') || customer.email.includes('disposable') ? 0.2 : 0,
  };

  const compositeScore = Math.min(
    1,
    factors.baseScore + factors.accountAgeRisk + factors.refundFrequencyRisk + factors.highValueRisk + factors.emailRisk
  );

  // Generate fraud alert if score is high
  if (compositeScore > 0.7) {
    addFraudAlert({
      id: generateId(),
      customerId: customer.id,
      customerName: customer.name,
      fraudScore: compositeScore,
      reason: compositeScore > 0.9
        ? 'CRITICAL: Extremely high fraud risk detected'
        : 'HIGH: Elevated fraud risk detected',
      timestamp: new Date().toISOString(),
      severity: compositeScore > 0.9 ? 'critical' : compositeScore > 0.8 ? 'high' : 'medium',
    });
  }

  const step: ReasoningStep = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    tool: 'calculate_fraud_score',
    input: { customerId },
    output: {
      compositeScore: Math.round(compositeScore * 100) / 100,
      factors,
      riskLevel: compositeScore > 0.9 ? 'critical' : compositeScore > 0.7 ? 'high' : compositeScore > 0.4 ? 'medium' : 'low',
      autoBlock: compositeScore > 0.7,
    },
    duration: Date.now() - startTime,
    status: 'completed',
  };

  addReasoningStep(conversationId, step);

  return {
    success: true,
    data: { compositeScore, factors, riskLevel: step.output.riskLevel, autoBlock: step.output.autoBlock },
    reasoningStep: step,
  };
}

export async function escalateToHuman(
  customerId: string,
  reason: string,
  conversationId: string
): Promise<ToolResult> {
  const startTime = Date.now();
  const customer = getCustomerById(customerId);

  const step: ReasoningStep = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    tool: 'escalate_to_human',
    input: { customerId, reason },
    output: {
      escalated: true,
      ticketId: `ESC-${Date.now().toString(36).toUpperCase()}`,
      priority: customer?.isVIP ? 'urgent' : 'normal',
      assignedTo: 'Supervisor Queue',
      estimatedWait: customer?.isVIP ? '< 2 minutes' : '5-10 minutes',
    },
    duration: Date.now() - startTime,
    status: 'completed',
  };

  addReasoningStep(conversationId, step);

  return {
    success: true,
    data: step.output,
    reasoningStep: step,
  };
}
