import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { TransactionStatus, PaymentMethod as PrismaPaymentMethod } from '@prisma/client';

export interface ConciliationResult {
  conciliationId: string;
  results: { transactionId: string; status: string }[];
}

@Injectable()
export class ConciliationService {
  private readonly logger = new Logger(ConciliationService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async conciliate(orgId: string, dto: { conciliationId: string; items: { transactionId: string; paidAt: string; paymentMethod: string; bankReference?: string }[] }, userId: string): Promise<ConciliationResult> {
    const results = [];

    for (const item of dto.items) {
      const tx = await this.prisma.transaction.findFirst({
        where: { id: item.transactionId, organizationId: orgId },
      });

      if (!tx) {
        results.push({ transactionId: item.transactionId, status: 'NOT_FOUND' });
        continue;
      }

      await this.prisma.transaction.update({
        where: { id: item.transactionId },
        data: {
          status: TransactionStatus.PAID,
          paidAt: new Date(item.paidAt),
          paymentMethod: item.paymentMethod as PrismaPaymentMethod,
          conciliationId: dto.conciliationId,
          auditTrail: {
            ...(tx.auditTrail as object || {}),
            conciliatedBy: userId,
            conciliatedAt: new Date().toISOString(),
            bankReference: item.bankReference,
          },
        },
      });

      results.push({ transactionId: item.transactionId, status: 'CONCILIATED' });
    }

    this.logger.log(`Conciliation batch ${dto.conciliationId}: ${results.length} items for org ${orgId}`);
    return { conciliationId: dto.conciliationId, results };
  }
}
