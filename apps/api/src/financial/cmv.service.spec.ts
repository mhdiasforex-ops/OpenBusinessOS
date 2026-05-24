import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CmvService } from './cmv.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CmvService', () => {
  let service: CmvService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      transaction: {
        findMany: vi.fn(),
      },
      product: {
        findMany: vi.fn(),
      },
    };
    service = new CmvService(prisma as unknown as PrismaService);
  });

  const orgId = 'org-123';

  function makeProduct(overrides: Partial<{
    id: string; name: string; sku: string; costPrice: number;
    salePrice: number; isActive: boolean; organizationId: string;
  }> = {}) {
    return {
      id: overrides.id ?? 'prod-1',
      name: overrides.name ?? 'Produto A',
      sku: overrides.sku ?? 'SKU-A',
      costPrice: overrides.costPrice ?? 30,
      salePrice: overrides.salePrice ?? 100,
      isActive: overrides.isActive ?? true,
      organizationId: overrides.organizationId ?? orgId,
    };
  }

  function makeItem(overrides: Partial<{
    productId: string; quantity: number; total: number; product: any;
  }> = {}) {
    return {
      productId: overrides.productId ?? 'prod-1',
      quantity: overrides.quantity ?? 5,
      total: overrides.total ?? 500,
      product: overrides.product !== undefined ? overrides.product : makeProduct(),
    };
  }

  function makeTx(overrides: Partial<{
    id: string; type: string; status: string; paidAt: Date;
    items: any[];
  }> = {}) {
    return {
      id: overrides.id ?? 'tx-1',
      type: overrides.type ?? 'INCOME',
      status: overrides.status ?? 'PAID',
      paidAt: overrides.paidAt ?? new Date('2026-01-15'),
      items: overrides.items ?? [],
    };
  }

  describe('calculateCMV', () => {
    it('should query PAID INCOME transactions in the given month with items', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      await service.calculateCMV(orgId, 1, 2026);
      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          type: 'INCOME',
          status: 'PAID',
          paidAt: {
            gte: new Date(2026, 0, 1),
            lte: new Date(2026, 1, 0, 23, 59, 59),
          },
        },
        include: { items: { include: { product: true } } },
      });
    });

    it('should aggregate by product and calculate total cost, revenue, margin', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({
          items: [
            makeItem({ productId: 'prod-1', quantity: 2, total: 200, product: makeProduct({ id: 'prod-1', costPrice: 30 }) }),
            makeItem({ productId: 'prod-2', quantity: 1, total: 150, product: makeProduct({ id: 'prod-2', costPrice: 50 }) }),
          ],
        }),
        makeTx({
          id: 'tx-2',
          items: [
            makeItem({ productId: 'prod-1', quantity: 3, total: 300, product: makeProduct({ id: 'prod-1', costPrice: 30 }) }),
          ],
        }),
      ]);
      const result = await service.calculateCMV(orgId, 1, 2026);
      const p1 = result.products.find((p) => p.productId === 'prod-1')!;
      const p2 = result.products.find((p) => p.productId === 'prod-2')!;
      expect(p1.quantitySold).toBe(5);
      expect(p1.totalCost).toBe(150);
      expect(p1.totalRevenue).toBe(500);
      expect(p1.grossMargin).toBe(350);
      expect(p1.grossMarginPercentage).toBe(70);
      expect(p2.quantitySold).toBe(1);
      expect(p2.totalCost).toBe(50);
      expect(p2.totalRevenue).toBe(150);
      expect(p2.grossMargin).toBe(100);
    });

    it('should flag products below 30% minimum margin', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({
          items: [
            makeItem({ productId: 'prod-low', quantity: 1, total: 100, product: makeProduct({ id: 'prod-low', costPrice: 90, name: 'Low Margin' }) }),
            makeItem({ productId: 'prod-high', quantity: 1, total: 100, product: makeProduct({ id: 'prod-high', costPrice: 10, name: 'High Margin' }) }),
          ],
        }),
      ]);
      const result = await service.calculateCMV(orgId, 1, 2026);
      const low = result.products.find((p) => p.productId === 'prod-low')!;
      const high = result.products.find((p) => p.productId === 'prod-high')!;
      expect(low.isBelowMinimum).toBe(true);
      expect(low.grossMarginPercentage).toBe(10);
      expect(high.isBelowMinimum).toBe(false);
      expect(high.grossMarginPercentage).toBe(90);
      expect(result.belowMinimumCount).toBe(1);
    });

    it('should sort products by margin ascending', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({
          items: [
            makeItem({ productId: 'prod-a', total: 100, quantity: 1, product: makeProduct({ id: 'prod-a', costPrice: 80, name: 'A', sku: 'A' }) }),
            makeItem({ productId: 'prod-b', total: 100, quantity: 1, product: makeProduct({ id: 'prod-b', costPrice: 50, name: 'B', sku: 'B' }) }),
            makeItem({ productId: 'prod-c', total: 100, quantity: 1, product: makeProduct({ id: 'prod-c', costPrice: 10, name: 'C', sku: 'C' }) }),
          ],
        }),
      ]);
      const result = await service.calculateCMV(orgId, 1, 2026);
      const margins = result.products.map((p) => p.grossMarginPercentage);
      expect(margins).toEqual([20, 50, 90]);
    });

    it('should calculate summary totals', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({
          items: [
            makeItem({ quantity: 2, total: 200, product: makeProduct({ costPrice: 30 }) }),
            makeItem({ quantity: 1, total: 150, product: makeProduct({ id: 'prod-2', costPrice: 50 }) }),
          ],
        }),
      ]);
      const result = await service.calculateCMV(orgId, 1, 2026);
      expect(result.totalCost).toBe(110);
      expect(result.totalRevenue).toBe(350);
      expect(result.grossMargin).toBe(240);
      expect(result.grossMarginPercentage).toBeCloseTo(68.57, 1);
    });

    it('should handle zero revenue gracefully', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      const result = await service.calculateCMV(orgId, 1, 2026);
      expect(result.totalCost).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.grossMargin).toBe(0);
      expect(result.grossMarginPercentage).toBe(0);
      expect(result.products).toHaveLength(0);
      expect(result.belowMinimumCount).toBe(0);
    });

    it('should skip items without a product', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({
          items: [
            makeItem({ productId: 'prod-1', product: makeProduct() }),
            makeItem({ productId: 'orphan', product: null }),
          ],
        }),
      ]);
      const result = await service.calculateCMV(orgId, 1, 2026);
      expect(result.products).toHaveLength(1);
      expect(result.products[0].productId).toBe('prod-1');
    });

    it('should handle transactions with no items', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({ items: [] }),
      ]);
      const result = await service.calculateCMV(orgId, 1, 2026);
      expect(result.products).toHaveLength(0);
      expect(result.totalRevenue).toBe(0);
    });

    it('should include product name and sku in results', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({
          items: [
            makeItem({ product: makeProduct({ id: 'prod-1', name: 'Produto X', sku: 'SKU-X' }) }),
          ],
        }),
      ]);
      const result = await service.calculateCMV(orgId, 1, 2026);
      expect(result.products[0].productName).toBe('Produto X');
      expect(result.products[0].sku).toBe('SKU-X');
    });

    it('should round grossMarginPercentage to 2 decimal places', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeTx({
          items: [
            makeItem({ quantity: 3, total: 100, product: makeProduct({ costPrice: 33.33 }) }),
          ],
        }),
      ]);
      const result = await service.calculateCMV(orgId, 1, 2026);
      expect(result.products[0].grossMarginPercentage).toBeCloseTo(0.01, 2);
    });
  });

  describe('getProductMargins', () => {
    it('should query active products for the organization', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      await service.getProductMargins(orgId);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId, isActive: true },
      });
    });

    it('should calculate margin with quantitySold and total fields as zero', async () => {
      prisma.product.findMany.mockResolvedValue([makeProduct({ costPrice: 30, salePrice: 100 })]);
      const result = await service.getProductMargins(orgId);
      expect(result).toHaveLength(1);
      expect(result[0].quantitySold).toBe(0);
      expect(result[0].totalCost).toBe(0);
      expect(result[0].totalRevenue).toBe(0);
      expect(result[0].grossMargin).toBe(70);
    });

    it('should calculate correct margin percentage', async () => {
      prisma.product.findMany.mockResolvedValue([
        makeProduct({ id: 'p1', costPrice: 25, salePrice: 100 }),
        makeProduct({ id: 'p2', costPrice: 80, salePrice: 100 }),
      ]);
      const result = await service.getProductMargins(orgId);
      expect(result[0].grossMarginPercentage).toBe(75);
      expect(result[0].isBelowMinimum).toBe(false);
      expect(result[1].grossMarginPercentage).toBe(20);
      expect(result[1].isBelowMinimum).toBe(true);
    });

    it('should return empty array when no active products', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      const result = await service.getProductMargins(orgId);
      expect(result).toEqual([]);
    });

    it('should handle zero salePrice (division by zero guard)', async () => {
      prisma.product.findMany.mockResolvedValue([makeProduct({ salePrice: 0, costPrice: 50 })]);
      const result = await service.getProductMargins(orgId);
      expect(result[0].grossMarginPercentage).toBe(0);
      expect(result[0].grossMargin).toBe(-50);
      expect(result[0].isBelowMinimum).toBe(true);
    });

    it('should handle negative margin products', async () => {
      prisma.product.findMany.mockResolvedValue([makeProduct({ costPrice: 200, salePrice: 100 })]);
      const result = await service.getProductMargins(orgId);
      expect(result[0].grossMargin).toBe(-100);
      expect(result[0].grossMarginPercentage).toBe(-100);
      expect(result[0].isBelowMinimum).toBe(true);
    });

    it('should include product metadata in response', async () => {
      prisma.product.findMany.mockResolvedValue([makeProduct({
        id: 'prod-x', name: 'X', sku: 'SKU-X', costPrice: 40, salePrice: 80,
      })]);
      const result = await service.getProductMargins(orgId);
      expect(result[0]).toMatchObject({
        productId: 'prod-x',
        productName: 'X',
        sku: 'SKU-X',
        costPrice: 40,
        salePrice: 80,
      });
    });
  });
});
