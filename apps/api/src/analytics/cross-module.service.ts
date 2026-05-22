import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CrossModuleService {
  private readonly logger = new Logger(CrossModuleService.name);

  constructor(private prisma: PrismaService) {}

  async getCustomerSegments(orgId: string) {
    const segments = await this.prisma.customer.groupBy({
      by: ['segment'],
      where: { organizationId: orgId },
      _count: { id: true },
      _sum: { ltv: true },
    });

    return segments.map((s) => ({
      segment: s.segment,
      count: s._count.id,
      totalLtv: Number(s._sum.ltv || 0),
    }));
  }

  async getProductPerformance(orgId: string, limit: number = 10) {
    const products = await this.prisma.product.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: { stockQuantity: 'asc' },
      take: limit,
      select: {
        id: true,
        name: true,
        sku: true,
        salePrice: true,
        costPrice: true,
        stockQuantity: true,
        minStock: true,
      },
    });

    return products.map((p) => ({
      ...p,
      margin: Number(p.salePrice) > 0
        ? Math.round(((Number(p.salePrice) - Number(p.costPrice)) / Number(p.salePrice)) * 10000) / 100
        : 0,
      isLowStock: p.stockQuantity <= p.minStock,
    }));
  }
}
