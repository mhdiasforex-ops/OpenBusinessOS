import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LtvService {
  private readonly logger = new Logger(LtvService.name);

  constructor(private prisma: PrismaService) {}

  async calculateLTV(orgId: string, customerId: string) {
    this.logger.log(`Calculando LTV para cliente ${customerId}`);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        customerId,
        type: 'INCOME',
        status: 'PAID',
      },
      orderBy: { paidAt: 'asc' },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalOrders = transactions.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate purchase frequency (orders per month)
    const firstOrder = transactions[0]?.paidAt;
    const lastOrder = transactions[transactions.length - 1]?.paidAt;
    const monthsDiff = firstOrder && lastOrder
      ? Math.max(1, (lastOrder.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 1;
    const purchaseFrequency = totalOrders / monthsDiff;

    // Simple LTV = avg order value * purchase frequency * 12 (annual projection)
    const ltv = avgOrderValue * purchaseFrequency * 12;

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        ltv: new Prisma.Decimal(Math.round(ltv * 100) / 100),
        totalOrders,
        lastOrderAt: lastOrder,
      },
    });

    this.logger.log(`LTV calculado para cliente ${customerId}: ${Math.round(ltv * 100) / 100}`);

    return {
      customerId,
      totalRevenue,
      totalOrders,
      avgOrderValue,
      purchaseFrequency: Math.round(purchaseFrequency * 100) / 100,
      ltv: Math.round(ltv * 100) / 100,
    };
  }
}
