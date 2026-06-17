export type CustomerStatus = 'active' | 'suspended' | 'vip' | 'new' | 'flagged';
export type RefundStatus = 'approved' | 'denied' | 'partial' | 'store_credit' | 'escalated' | 'pending';
export type AgentToolName = 'lookup_customer' | 'validate_refund_policy' | 'calculate_fraud_score' | 'escalate_to_human';

export interface Customer {
  id: string;
  name: string;
  email: string;
  status: CustomerStatus;
  accountAge: number; // days
  totalOrders: number;
  totalSpent: number;
  refundHistory: RefundRecord[];
  fraudScore: number;
  isVIP: boolean;
  notes: string;
  createdAt: string;
}

export interface RefundRecord {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  date: string;
  status: RefundStatus;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  date: string;
  daysSincePurchase: number;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface RefundRequest {
  customerId: string;
  orderId: string;
  reason: string;
  amount: number;
  hasProof: boolean;
  proofType?: string;
}

export interface PolicyViolation {
  rule: string;
  description: string;
  severity: 'hard_block' | 'warning' | 'info';
}

export interface AgentDecision {
  status: RefundStatus;
  amount: number;
  reasoning: string;
  policyViolations: PolicyViolation[];
  confidence: number;
  alternatives: string[];
  requiresEscalation: boolean;
}

export interface ReasoningStep {
  id: string;
  timestamp: string;
  tool: AgentToolName | 'thinking' | 'decision';
  input: Record<string, any>;
  output: Record<string, any>;
  duration: number;
  status: 'running' | 'completed' | 'error';
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    decision?: AgentDecision;
    reasoningSteps?: ReasoningStep[];
    customerInfo?: Customer;
    isVoice?: boolean;
  };
}

export interface AgentState {
  conversationId: string;
  customerId: string | null;
  messages: ConversationMessage[];
  reasoningSteps: ReasoningStep[];
  denialCount: number;
  currentDecision: AgentDecision | null;
  isEscalated: boolean;
  startedAt: string;
}

export interface DashboardStats {
  totalConversations: number;
  approvedRefunds: number;
  deniedRefunds: number;
  escalatedCases: number;
  avgConfidence: number;
  avgResponseTime: number;
  fraudAlerts: number;
  totalRefundAmount: number;
}

export interface FraudAlert {
  id: string;
  customerId: string;
  customerName: string;
  fraudScore: number;
  reason: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
