import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CMVResult {
  productId: string;
  productName: string;
  sku: string;
  costPrice: number;
  salePrice: number;
  quantitySold: number;
  totalCost: number;
  totalRevenue: number;
  grossMargin: number;
  grossMarginPercentage: number;
  isBelowMinimum: boolean;
}

export interface CMVSummary {
  totalCost: number;
  totalRevenue: number;
  grossMargin: number;
  grossMarginPercentage: number;
  belowMinimumCount: number;
  products: CMVResult[];
}

@Injectable()
export class CmvService {
  private readonly logger = new Logger(CmvService.name);

  constructor(private prisma: PrismaService) {}

  async calculateCMV(orgId: string, month: number, year: number): Promise<CMVSummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all paid income transactions with items for the period
    const transactions = await this.prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        type: 'INCOME',
        status: 'PAID',
        paidAt: { gte: startDate, lte: endDate },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    // Aggregate by product
    const productMap = new Map<string, { product: any; quantitySold: number; totalCost: number; totalRevenue: number }>();

    for (const tx of transactions) {
      for (const item of tx.items) {
        if (!item.product) continue;
        const existing = productMap.get(item.productId) || {
          product: item.product,
          quantitySold: 0,
          totalCost: 0,
          totalRevenue: 0,
        };
        existing.quantitySold += Number(item.quantity);
        existing.totalCost += Number(item.product.costPrice) * Number(item.quantity);
        existing.totalRevenue += Number(item.total);
        productMap.set(item.productId, existing);
      }
    }

    const products: CMVResult[] = [];
    let totalCost = 0;
    let totalRevenue = 0;

    for (const [productId, data] of Array.from(productMap.entries())) {
      const grossMargin = data.totalRevenue - data.totalCost;
      const grossMarginPercentage = data.totalRevenue > 0 ? (grossMargin / data.totalRevenue) * 100 : 0;

      // A product is below minimum margin if margin < 30% (configurable)
      const minimumMargin = 30;
      const isBelowMinimum = grossMarginPercentage < minimumMargin;

      products.push({
        productId,
        productName: data.product.name,
        sku: data.product.sku,
        costPrice: Number(data.product.costPrice),
        salePrice: Number(data.product.salePrice),
        quantitySold: data.quantitySold,
        totalCost: data.totalCost,
        totalRevenue: data.totalRevenue,
        grossMargin,
        grossMarginPercentage: Math.round(grossMarginPercentage * 100) / 100,
        isBelowMinimum,
      });

      totalCost += data.totalCost;
      totalRevenue += data.totalRevenue;
    }

    const grossMargin = totalRevenue - totalCost;
    const grossMarginPercentage = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

    return {
      totalCost,
      totalRevenue,
      grossMargin,
      grossMarginPercentage: Math.round(grossMarginPercentage * 100) / 100,
      belowMinimumCount: products.filter((p) => p.isBelowMinimum).length,
      products: products.sort((a, b) => a.grossMarginPercentage - b.grossMarginPercentage),
    };
  }

  async getProductMargins(orgId: string): Promise<CMVResult[]> {
    const products = await this.prisma.product.findMany({
      where: { organizationId: orgId, isActive: true },
    });

    return products.map((p) => {
      const costPrice = Number(p.costPrice);
      const salePrice = Number(p.salePrice);
      const grossMargin = salePrice - costPrice;
      const grossMarginPercentage = salePrice > 0 ? (grossMargin / salePrice) * 100 : 0;
      const minimumMargin = 30;

      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        costPrice,
        salePrice,
        quantitySold: 0,
        totalCost: 0,
        totalRevenue: 0,
        grossMargin,
        grossMarginPercentage: Math.round(grossMarginPercentage * 100) / 100,
        isBelowMinimum: grossMarginPercentage < minimumMargin,
      };
    });
  }
}
