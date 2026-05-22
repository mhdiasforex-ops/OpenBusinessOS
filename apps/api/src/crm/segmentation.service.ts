import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerSegment } from '@prisma/client';

export interface SegmentationResult {
  segments: Record<string, number>;
  totalCustomers: number;
  churnRiskCount: number;
  churnRiskCustomerIds: string[];
}

@Injectable()
export class SegmentationService {
  private readonly logger = new Logger(SegmentationService.name);

  constructor(private prisma: PrismaService) {}

  async segmentCustomers(orgId: string): Promise<SegmentationResult> {
    this.logger.log(`Segmentando clientes da organização ${orgId}`);

    const customers = await this.prisma.customer.findMany({
      where: { organizationId: orgId },
      include: {
        transactions: {
          where: { type: 'INCOME', status: 'PAID' },
          orderBy: { paidAt: 'desc' },
          take: 1,
        },
      },
    });

    const segments = { VIP: 0, REGULAR: 0, NEW: 0, AT_RISK: 0, CHURNED: 0 } as Record<string, number>;
    const churnRiskCustomerIds: string[] = [];

    for (const customer of customers) {
      const ltv = Number(customer.ltv);
      const lastOrder = customer.transactions[0]?.paidAt;
      const daysSinceLastOrder = lastOrder
        ? Math.ceil((Date.now() - lastOrder.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      let segment: CustomerSegment = customer.segment as CustomerSegment;

      if (ltv > 10000 && daysSinceLastOrder < 30) {
        segment = CustomerSegment.VIP;
      } else if (daysSinceLastOrder > 90) {
        segment = CustomerSegment.CHURNED;
      } else if (daysSinceLastOrder > 60) {
        segment = CustomerSegment.AT_RISK;
        churnRiskCustomerIds.push(customer.id);
      } else if (customer.totalOrders > 3) {
        segment = CustomerSegment.REGULAR;
      } else {
        segment = CustomerSegment.NEW;
      }

      segments[segment]++;

      if (segment !== customer.segment) {
        await this.prisma.customer.update({
          where: { id: customer.id },
          data: { segment },
        });
      }
    }

    this.logger.log(`Segmentação concluída: ${JSON.stringify(segments)}, ${churnRiskCustomerIds.length} clientes em risco de churn`);

    return {
      segments,
      totalCustomers: customers.length,
      churnRiskCount: churnRiskCustomerIds.length,
      churnRiskCustomerIds,
    };
  }
}
