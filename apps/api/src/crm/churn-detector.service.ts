import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { EventTypes } from '@openbusinessos/event-definitions';

export interface ChurnRiskInfo {
  customerId: string;
  name: string;
  riskScore: number;
  lastOrderDaysAgo: number;
}

@Injectable()
export class ChurnDetectorService {
  private readonly logger = new Logger(ChurnDetectorService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async detectAndEmitChurnRisk(orgId: string, customerIds: string[]): Promise<ChurnRiskInfo[]> {
    if (customerIds.length === 0) {
      this.logger.log('Nenhum cliente em risco de churn para processar');
      return [];
    }

    this.logger.log(`Processando ${customerIds.length} clientes em risco de churn`);

    const customers = await this.prisma.customer.findMany({
      where: {
        id: { in: customerIds },
        organizationId: orgId,
      },
      include: {
        transactions: {
          where: { type: 'INCOME', status: 'PAID' },
          orderBy: { paidAt: 'desc' },
          take: 1,
        },
      },
    });

    const churnRiskInfos: ChurnRiskInfo[] = [];

    for (const customer of customers) {
      const lastOrderDaysAgo = Math.ceil(
        (Date.now() - (customer.transactions[0]?.paidAt?.getTime() || 0)) / (1000 * 60 * 60 * 24),
      );

      const riskInfo: ChurnRiskInfo = {
        customerId: customer.id,
        name: customer.name,
        riskScore: 0.7,
        lastOrderDaysAgo,
      };

      churnRiskInfos.push(riskInfo);

      await this.eventBus.emit({
        organizationId: orgId,
        type: EventTypes.CUSTOMER_CHURN_RISK,
        source: 'churn-detector-service',
        payload: {
          customerId: customer.id,
          name: customer.name,
          riskScore: riskInfo.riskScore,
          lastOrderDaysAgo,
        },
      });
    }

    this.logger.log(`${churnRiskInfos.length} eventos CUSTOMER_CHURN_RISK emitidos`);

    return churnRiskInfos;
  }
}
