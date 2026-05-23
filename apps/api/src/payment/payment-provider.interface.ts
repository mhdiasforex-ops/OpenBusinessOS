export interface CreateChargeInput {
  externalId?: string;
  method: string;
  amount: number;
  description?: string;
  dueDate?: string;
  customerDoc?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface ChargeResult {
  externalId: string;
  status: string;
  pixCode?: string;
  pixQrCode?: string;
  boletoUrl?: string;
  boletoBarCode?: string;
  fee: number;
}

export interface WebhookResult {
  externalId: string;
  status: string;
  paidAt?: Date;
  fee?: number;
}

export interface PaymentProvider {
  createCharge(input: CreateChargeInput): Promise<ChargeResult>;
  checkStatus(externalId: string): Promise<{ status: string; paidAt?: Date }>;
  cancelCharge(externalId: string): Promise<{ success: boolean }>;
  refundCharge(externalId: string, amount?: number): Promise<{ success: boolean }>;
  processWebhook(payload: any, signature?: string): Promise<WebhookResult>;
}
