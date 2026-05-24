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
export class ManualProvider implements PaymentProvider {
 private readonly logger = new Logger(ManualProvider.name);

 async createCharge(data: {
  amount: number;
  method: PaymentMethod;
  customerId?: string;
  description?: string;
  dueDate?: string;
  metadata?: Record<string, any>;
 }): Promise<CreateChargeResult> {
  this.logger.log(`Manual createCharge: amount=${data.amount}, method=${data.method}`);

  return {
   externalId: `manual-${Date.now()}`,
   status: PaymentStatus.PENDING,
   fee: 0,
   netAmount: data.amount,
  };
 }

 async checkStatus(externalId: string): Promise<CheckStatusResult> {
  this.logger.log(`Manual checkStatus: ${externalId}`);
  return {
   externalId,
   status: PaymentStatus.PENDING,
  };
 }

 async cancelCharge(externalId: string): Promise<CancelChargeResult> {
  this.logger.log(`Manual cancelCharge: ${externalId}`);
  return {
   externalId,
   status: PaymentStatus.CANCELLED,
  };
 }

 async refundCharge(externalId: string): Promise<RefundChargeResult> {
  this.logger.log(`Manual refundCharge: ${externalId}`);
  return {
   externalId,
   status: PaymentStatus.REFUNDED,
  };
 }

 async processWebhook(payload: any, signature?: string): Promise<WebhookResult> {
  this.logger.log('Manual processWebhook');
  return {
   externalId: payload?.externalId || 'unknown',
   status: PaymentStatus.PENDING,
  };
 }
}
