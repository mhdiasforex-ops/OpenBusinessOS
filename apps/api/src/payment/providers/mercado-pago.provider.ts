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
export class MercadoPagoProvider implements PaymentProvider {
  private readonly logger = new Logger(MercadoPagoProvider.name);

  async createCharge(data: {
    amount: number;
    method: PaymentMethod;
    customerId?: string;
    description?: string;
    dueDate?: string;
    metadata?: Record<string, any>;
  }): Promise<CreateChargeResult> {
    // TODO: Implementar chamada HTTP real à API do Mercado Pago
    // POST https://api.mercadopago.com/v1/payments
    this.logger.log(`MercadoPago createCharge: amount=${data.amount}, method=${data.method}`);

    const fee = data.method === PaymentMethod.PIX ? 0.99 : data.amount * 0.0399;
    const netAmount = data.amount - fee;

    return {
      externalId: `mp_stub_${Date.now()}`,
      status: PaymentStatus.PENDING,
      pixCode: data.method === PaymentMethod.PIX ? '00020126...STUB_MP_PIX_CODE' : undefined,
      pixQrCode: data.method === PaymentMethod.PIX ? 'data:image/png;base64,...STUB_MP_QR' : undefined,
      boletoUrl: data.method === PaymentMethod.BANK_SLIP ? 'https://mercadopago.com/boleto/stub' : undefined,
      boletoBarCode: data.method === PaymentMethod.BANK_SLIP ? '98765432109876543210987654321098765432109876' : undefined,
      fee,
      netAmount,
    };
  }

  async checkStatus(externalId: string): Promise<CheckStatusResult> {
    // TODO: Implementar chamada HTTP real à API do Mercado Pago
    // GET https://api.mercadopago.com/v1/payments/{externalId}
    this.logger.log(`MercadoPago checkStatus: externalId=${externalId}`);

    return {
      externalId,
      status: PaymentStatus.PENDING,
    };
  }

  async cancelCharge(externalId: string): Promise<CancelChargeResult> {
    // TODO: Implementar chamada HTTP real à API do Mercado Pago
    // PUT https://api.mercadopago.com/v1/payments/{externalId} { status: "cancelled" }
    this.logger.log(`MercadoPago cancelCharge: externalId=${externalId}`);

    return {
      externalId,
      status: PaymentStatus.CANCELLED,
    };
  }

  async refundCharge(externalId: string): Promise<RefundChargeResult> {
    // TODO: Implementar chamada HTTP real à API do Mercado Pago
    // POST https://api.mercadopago.com/v1/payments/{externalId}/refunds
    this.logger.log(`MercadoPago refundCharge: externalId=${externalId}`);

    return {
      externalId,
      status: PaymentStatus.REFUNDED,
    };
  }

  async processWebhook(payload: any, signature?: string): Promise<WebhookResult> {
    // TODO: Implementar parsing real do webhook do Mercado Pago
    // Validar assinatura (x-signature header), extrair data.id e action
    this.logger.log(`MercadoPago processWebhook: action=${payload?.action}`);

    return {
      externalId: payload?.data?.id ?? 'unknown',
      status: PaymentStatus.CONFIRMED,
      paidAt: new Date(),
    };
  }
}
