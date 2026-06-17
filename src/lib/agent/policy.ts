import { Customer, Order, PolicyViolation, RefundRequest } from './types';

export const REFUND_POLICY = `
# E-Commerce Refund Policy v2.1

## Auto-Deny Rules (Hard Blocks)
1. **Fraud Score > 0.7**: Automatic denial. Account flagged for security review.
2. **3+ Refunds in 90 Days**: Automatic denial. Excessive return pattern detected.
3. **Account Age < 7 Days**: Automatic denial. Account too new for refund processing.
4. **Missing Proof of Purchase/Damage**: Automatic denial. Documentation required.

## Refund Tiers
- **Full Refund (100%)**: Within 30 days, item unopened/undamaged, with proof
- **Partial Refund (80%)**: Within 30 days, opened but undamaged, with proof
- **Store Credit Only**: 31-60 days from purchase
- **No Refund**: 60+ days from purchase

## VIP Customer Overrides
- VIP customers receive extended 90-day full refund window
- VIP customers bypass the 3-refunds-in-90-days rule
- VIP customers CANNOT bypass fraud score checks
- VIP customers get priority human escalation

## Escalation Rules
- 3 consecutive denials → Automatic escalation to human supervisor
- VIP customer requests human agent → Immediate escalation
- Fraud score > 0.9 → Mandatory human review
- Customer disputes auto-deny decision → One re-review allowed

## Alternative Offers (When Denying)
- Store credit at 110% of refund value
- Exchange for different item
- Discount on next purchase (15-25%)
- Free shipping on next 3 orders
`;

export function validateRefundPolicy(
  customer: Customer,
  order: Order | undefined,
  request: RefundRequest
): { violations: PolicyViolation[]; canProcess: boolean; recommendedAction: string; refundPercentage: number } {
  const violations: PolicyViolation[] = [];
  let canProcess = true;
  let refundPercentage = 100;
  let recommendedAction = 'approve_full';

  // Rule 1: Fraud score check
  if (customer.fraudScore > 0.7) {
    violations.push({
      rule: 'FRAUD_SCORE_HIGH',
      description: `Fraud score ${customer.fraudScore} exceeds threshold of 0.7. Auto-deny triggered.`,
      severity: 'hard_block',
    });
    canProcess = false;
    recommendedAction = 'deny_fraud';
  }

  // Rule 2: Refund frequency check (3+ in 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const recentRefunds = customer.refundHistory.filter(
    r => new Date(r.date) >= ninetyDaysAgo
  );

  if (recentRefunds.length >= 3 && !customer.isVIP) {
    violations.push({
      rule: 'EXCESSIVE_REFUNDS_90D',
      description: `${recentRefunds.length} refunds in last 90 days (limit: 3). Auto-deny triggered.`,
      severity: 'hard_block',
    });
    canProcess = false;
    recommendedAction = 'deny_frequency';
  }

  // Rule 3: Account age check
  if (customer.accountAge < 7) {
    violations.push({
      rule: 'ACCOUNT_TOO_NEW',
      description: `Account age ${customer.accountAge} days is below minimum 7 days. Auto-deny triggered.`,
      severity: 'hard_block',
    });
    canProcess = false;
    recommendedAction = 'deny_new_account';
  }

  // Rule 4: Missing proof
  if (!request.hasProof) {
    violations.push({
      rule: 'MISSING_PROOF',
      description: 'No proof of purchase or damage provided. Documentation required.',
      severity: 'hard_block',
    });
    canProcess = false;
    recommendedAction = 'deny_no_proof';
  }

  // If no hard blocks, determine refund tier
  if (canProcess && order) {
    const daysSincePurchase = order.daysSincePurchase;

    if (customer.isVIP) {
      // VIP: 90-day full refund window
      if (daysSincePurchase <= 90) {
        refundPercentage = 100;
        recommendedAction = 'approve_full';
      } else {
        refundPercentage = 0;
        recommendedAction = 'deny_time_expired';
        canProcess = false;
        violations.push({
          rule: 'VIP_WINDOW_EXPIRED',
          description: `${daysSincePurchase} days since purchase exceeds VIP 90-day window.`,
          severity: 'warning',
        });
      }
    } else {
      // Regular customers
      if (daysSincePurchase <= 30) {
        refundPercentage = 100;
        recommendedAction = 'approve_full';
      } else if (daysSincePurchase <= 60) {
        refundPercentage = 0;
        recommendedAction = 'offer_store_credit';
        violations.push({
          rule: 'OUTSIDE_REFUND_WINDOW',
          description: `${daysSincePurchase} days since purchase. Only store credit available (31-60 day window).`,
          severity: 'warning',
        });
      } else {
        refundPercentage = 0;
        canProcess = false;
        recommendedAction = 'deny_time_expired';
        violations.push({
          rule: 'REFUND_WINDOW_CLOSED',
          description: `${daysSincePurchase} days since purchase exceeds 60-day maximum.`,
          severity: 'hard_block',
        });
      }
    }
  }

  // Warning: elevated fraud (but not auto-deny)
  if (customer.fraudScore > 0.4 && customer.fraudScore <= 0.7) {
    violations.push({
      rule: 'ELEVATED_FRAUD_RISK',
      description: `Fraud score ${customer.fraudScore} is elevated. Manual review recommended.`,
      severity: 'warning',
    });
  }

  return { violations, canProcess, recommendedAction, refundPercentage };
}
