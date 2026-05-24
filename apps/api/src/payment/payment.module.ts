import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { AsaasProvider } from './providers/asaas.provider';
import { MercadoPagoProvider } from './providers/mercado-pago.provider';
import { ManualProvider } from './providers/manual.provider';

@Module({
 controllers: [PaymentController],
 providers: [PaymentService, AsaasProvider, MercadoPagoProvider, ManualProvider],
 exports: [PaymentService],
})
export class PaymentModule {}
