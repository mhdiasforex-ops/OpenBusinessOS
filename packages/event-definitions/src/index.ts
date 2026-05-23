// ============================================================
// OpenBusinessOS — Event Definitions
// ============================================================

// --- Event Type Constants ---

export const EventTypes = {
  ORG_CREATED: 'ORG_CREATED',
  ORG_UPDATED: 'ORG_UPDATED',
  USER_REGISTERED: 'USER_REGISTERED',
  USER_INVITED: 'USER_INVITED',
  TRANSACTION_CREATED: 'TRANSACTION_CREATED',
  TRANSACTION_PAID: 'TRANSACTION_PAID',
  TRANSACTION_OVERDUE: 'TRANSACTION_OVERDUE',
  PAYMENT_OVERDUE: 'PAYMENT_OVERDUE',
  STOCK_LOW: 'STOCK_LOW',
  STOCK_OUT: 'STOCK_OUT',
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_CHURN_RISK: 'CUSTOMER_CHURN_RISK',
  CAMPAIGN_SENT: 'CAMPAIGN_SENT',
  WORKFLOW_TRIGGERED: 'WORKFLOW_TRIGGERED',
  WORKFLOW_COMPLETED: 'WORKFLOW_COMPLETED',
  WORKFLOW_FAILED: 'WORKFLOW_FAILED',
 ONBOARDING_COMPLETED: 'ONBOARDING_COMPLETED',
 ANOMALY_DETECTED: 'ANOMALY_DETECTED',
 ORDER_CREATED: 'ORDER_CREATED',
 ORDER_UPDATED: 'ORDER_UPDATED',
 ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
 QUOTE_CONVERTED: 'QUOTE_CONVERTED',
 APPOINTMENT_CREATED: 'APPOINTMENT_CREATED',
 APPOINTMENT_CONFIRMED: 'APPOINTMENT_CONFIRMED',
 APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
 REPORT_EXECUTED: 'REPORT_EXECUTED',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

// --- Event Payload Interfaces ---

export interface OrgCreatedPayload {
  organizationId: string;
  name: string;
  niche: string;
  ownerEmail: string;
}

export interface OrgUpdatedPayload {
  organizationId: string;
  changes: Record<string, any>;
}

export interface UserRegisteredPayload {
  userId: string;
  organizationId: string;
  email: string;
  name: string;
}

export interface UserInvitedPayload {
  organizationId: string;
  email: string;
  role: string;
  invitedBy: string;
}

export interface TransactionCreatedPayload {
  transactionId: string;
  organizationId: string;
  type: string;
  amount: number;
  category: string;
  dueDate: string;
}

export interface TransactionPaidPayload {
  transactionId: string;
  organizationId: string;
  amount: number;
  paymentMethod: string;
  paidAt: string;
}

export interface PaymentOverduePayload {
  transactionId: string;
  organizationId: string;
  amount: number;
  daysOverdue: number;
  customerId?: string;
}

export interface StockLowPayload {
  productId: string;
  organizationId: string;
  productName: string;
  currentStock: number;
  minStock: number;
}

export interface CustomerCreatedPayload {
  customerId: string;
  organizationId: string;
  name: string;
  email: string;
  segment: string;
}

export interface CustomerChurnRiskPayload {
  customerId: string;
  organizationId: string;
  name: string;
  riskScore: number;
  lastOrderDaysAgo: number;
}

export interface CampaignSentPayload {
  campaignId: string;
  organizationId: string;
  name: string;
  recipientCount: number;
  channel: string;
}

export interface WorkflowTriggeredPayload {
  workflowId: string;
  organizationId: string;
  triggerEvent: string;
  triggerData: Record<string, any>;
}

export interface WorkflowCompletedPayload {
  workflowId: string;
  organizationId: string;
  executionId: string;
  duration: number;
}

export interface WorkflowFailedPayload {
  workflowId: string;
  organizationId: string;
  executionId: string;
  stepIndex: number;
  error: string;
}

export interface OnboardingCompletedPayload {
  organizationId: string;
  niche: string;
  completedSteps: string[];
}

export interface AnomalyDetectedPayload {
 organizationId: string;
 type: string;
 description: string;
 severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
 data: Record<string, any>;
}

export interface OrderCreatedPayload {
 orderId: string;
 organizationId: string;
 customerId: string;
 type: string;
 status: string;
 total: number;
 number: string;
}

export interface OrderUpdatedPayload {
 orderId: string;
 organizationId: string;
 changes: Record<string, any>;
}

export interface OrderStatusChangedPayload {
 orderId: string;
 organizationId: string;
 previousStatus: string;
 newStatus: string;
 total: number;
}

export interface QuoteConvertedPayload {
 orderId: string;
 organizationId: string;
 customerId: string;
 total: number;
 previousType: string;
}

// --- Event Map (type-safe lookup) ---

export interface EventPayloadMap {
  [EventTypes.ORG_CREATED]: OrgCreatedPayload;
  [EventTypes.ORG_UPDATED]: OrgUpdatedPayload;
  [EventTypes.USER_REGISTERED]: UserRegisteredPayload;
  [EventTypes.USER_INVITED]: UserInvitedPayload;
  [EventTypes.TRANSACTION_CREATED]: TransactionCreatedPayload;
  [EventTypes.TRANSACTION_PAID]: TransactionPaidPayload;
  [EventTypes.PAYMENT_OVERDUE]: PaymentOverduePayload;
  [EventTypes.STOCK_LOW]: StockLowPayload;
  [EventTypes.CUSTOMER_CREATED]: CustomerCreatedPayload;
  [EventTypes.CUSTOMER_CHURN_RISK]: CustomerChurnRiskPayload;
  [EventTypes.CAMPAIGN_SENT]: CampaignSentPayload;
  [EventTypes.WORKFLOW_TRIGGERED]: WorkflowTriggeredPayload;
  [EventTypes.WORKFLOW_COMPLETED]: WorkflowCompletedPayload;
  [EventTypes.WORKFLOW_FAILED]: WorkflowFailedPayload;
 [EventTypes.ONBOARDING_COMPLETED]: OnboardingCompletedPayload;
 [EventTypes.ANOMALY_DETECTED]: AnomalyDetectedPayload;
 [EventTypes.ORDER_CREATED]: OrderCreatedPayload;
 [EventTypes.ORDER_UPDATED]: OrderUpdatedPayload;
 [EventTypes.ORDER_STATUS_CHANGED]: OrderStatusChangedPayload;
 [EventTypes.QUOTE_CONVERTED]: QuoteConvertedPayload;
}
