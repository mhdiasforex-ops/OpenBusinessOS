import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  CreateChargeResult,
  CheckStatusResult,
  CancelChargeResult,
  RefundChargeResult,
  WebhookResult,
  PaymentMethod,
  PaymentStatus,
} from '../payment.dto';

@Injectable()
export class AsaasProvider implements PaymentProvider {
  private readonly logger = new Logger(AsaasProvider.name);

  async createCharge(data: {
    amount: number;
    method: PaymentMethod;
    customerId?: string;
    description?: string;
    dueDate?: string;
    metadata?: Record<string, any>;
  }): Promise<CreateChargeResult> {
    // TODO: Implementar chamada HTTP real à API do Asaas
    // POST https://api.asaas.com/v3/payments
    this.logger.log(`Asaas createCharge: amount=${data.amount}, method=${data.method}`);

    const fee = data.method === PaymentMethod.PIX ? 0 : data.amount * 0.0399;
    const netAmount = data.amount - fee;

    return {
      externalId: `asaas_stub_${Date.now()}`,
      status: PaymentStatus.PENDING,
      pixCode: data.method === PaymentMethod.PIX ? '00020126...STUB_PIX_CODE' : undefined,
      pixQrCode: data.method === PaymentMethod.PIX ? 'data:image/png;base64,...STUB_QR' : undefined,
      boletoUrl: data.method === PaymentMethod.BANK_SLIP ? 'https://asaas.com/boleto/stub' : undefined,
      boletoBarCode: data.method === PaymentMethod.BANK_SLIP ? '12345678901234567890123456789012345678901234' : undefined,
      fee,
      netAmount,
    };
  }

  async checkStatus(externalId: string): Promise<CheckStatusResult> {
    // TODO: Implementar chamada HTTP real à API do Asaas
    // GET https://api.asaas.com/v3/payments/{externalId}
    this.logger.log(`Asaas checkStatus: externalId=${externalId}`);

    return {
      externalId,
      status: PaymentStatus.PENDING,
    };
  }

  async cancelCharge(externalId: string): Promise<CancelChargeResult> {
    // TODO: Implementar chamada HTTP real à API do Asaas
    // DELETE https://api.asaas.com/v3/payments/{externalId}
    this.logger.log(`Asaas cancelCharge: externalId=${externalId}`);

    return {
      externalId,
      status: PaymentStatus.CANCELLED,
    };
  }

  async refundCharge(externalId: string): Promise<RefundChargeResult> {
    // TODO: Implementar chamada HTTP real à API do Asaas
    // POST https://api.asaas.com/v3/payments/{externalId}/refund
    this.logger.log(`Asaas refundCharge: externalId=${externalId}`);

    return {
      externalId,
      status: PaymentStatus.REFUNDED,
    };
  }

  async processWebhook(payload: any, signature?: string): Promise<WebhookResult> {
    // TODO: Implementar parsing real do webhook do Asaas
    // Validar assinatura com webhookSecret, extrair externalId e status
    this.logger.log(`Asaas processWebhook: event=${payload?.event}`);

    return {
      externalId: payload?.payment?.id ?? 'unknown',
      status: PaymentStatus.CONFIRMED,
      paidAt: payload?.payment?.confirmedDate ? new Date(payload.payment.confirmedDate) : undefined,
    };
  }
}
