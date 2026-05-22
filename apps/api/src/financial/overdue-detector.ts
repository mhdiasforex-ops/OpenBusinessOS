import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { EventTypes } from '@openbusinessos/event-definitions';
import { TransactionStatus } from '@prisma/client';

export interface OverdueResult {
  count: number;
  transactions: any[];
}

@Injectable()
export class OverdueDetector {
  private readonly logger = new Logger(OverdueDetector.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  /**
   * Detecta pagamentos em atraso: busca transações PENDING com dueDate < agora,
   * marca como OVERDUE e emite eventos PAYMENT_OVERDUE.
   */
  async detect(orgId: string): Promise<OverdueResult> {
    const overdue = await this.prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        status: 'PENDING',
        dueDate: { lt: new Date() },
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    // Marcar como overdue
    const ids = overdue.map((t) => t.id);
    if (ids.length > 0) {
      await this.prisma.transaction.updateMany({
        where: { id: { in: ids } },
        data: { status: TransactionStatus.OVERDUE },
      });
    }

    // Emitir eventos
    for (const tx of overdue) {
      await this.eventBus.emit({
        organizationId: orgId,
        type: EventTypes.PAYMENT_OVERDUE,
        source: 'overdue-detector',
        payload: {
          transactionId: tx.id,
          amount: Number(tx.amount),
          daysOverdue: Math.ceil(
            (Date.now() - tx.dueDate.getTime()) / (1000 * 60 * 60 * 24),
          ),
          customerId: tx.customerId,
        },
      });
    }

    this.logger.log(
      `Detected ${overdue.length} overdue transactions for org ${orgId}`,
    );

    return { count: overdue.length, transactions: overdue };
  }
}
