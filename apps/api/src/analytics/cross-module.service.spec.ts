import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrossModuleService } from './cross-module.service';

describe('CrossModuleService', () => {
  let service: CrossModuleService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      customer: { groupBy: vi.fn() },
      product: { findMany: vi.fn() },
    };
    service = new CrossModuleService(prisma);
  });

  const orgId = 'org-123';

  describe('getCustomerSegments', () => {
    it('should return segments with count and totalLtv', async () => {
      prisma.customer.groupBy.mockResolvedValue([
        { segment: 'VIP', _count: { id: 10 }, _sum: { ltv: 50000 } },
        { segment: 'REGULAR', _count: { id: 30 }, _sum: { ltv: 60000 } },
        { segment: 'NEW', _count: { id: 15 }, _sum: { ltv: 5000 } },
      ]);

      const result = await service.getCustomerSegments(orgId);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ segment: 'VIP', count: 10, totalLtv: 50000 });
      expect(result[1]).toEqual({ segment: 'REGULAR', count: 30, totalLtv: 60000 });
      expect(result[2]).toEqual({ segment: 'NEW', count: 15, totalLtv: 5000 });
    });

    it('should return empty array when no customers exist', async () => {
      prisma.customer.groupBy.mockResolvedValue([]);

      const result = await service.getCustomerSegments(orgId);

      expect(result).toEqual([]);
    });

    it('should return segment with single entry', async () => {
      prisma.customer.groupBy.mockResolvedValue([
        { segment: 'VIP', _count: { id: 5 }, _sum: { ltv: 25000 } },
      ]);

      const result = await service.getCustomerSegments(orgId);

      expect(result).toHaveLength(1);
      expect(result[0].segment).toBe('VIP');
      expect(result[0].count).toBe(5);
    });

    it('should handle null ltv values', async () => {
      prisma.customer.groupBy.mockResolvedValue([
        { segment: 'VIP', _count: { id: 2 }, _sum: { ltv: null } },
      ]);

      const result = await service.getCustomerSegments(orgId);

      expect(result[0].totalLtv).toBe(0);
    });

    it('should pass correct groupBy query', async () => {
      prisma.customer.groupBy.mockResolvedValue([]);

      await service.getCustomerSegments(orgId);

      expect(prisma.customer.groupBy).toHaveBeenCalledWith({
        by: ['segment'],
        where: { organizationId: orgId },
        _count: { id: true },
        _sum: { ltv: true },
      });
    });
  });

  describe('getProductPerformance', () => {
    it('should return products with margin and lowStock flag', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1', name: 'Product A', sku: 'SKU-001',
          salePrice: 100, costPrice: 60, stockQuantity: 50, minStock: 10,
        },
        {
          id: 'p2', name: 'Product B', sku: 'SKU-002',
          salePrice: 200, costPrice: 150, stockQuantity: 5, minStock: 10,
        },
      ]);

      const result = await service.getProductPerformance(orgId, 10);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'p1', name: 'Product A', margin: 40, isLowStock: false,
      });
      expect(result[1]).toMatchObject({
        id: 'p2', name: 'Product B', margin: 25, isLowStock: true,
      });
    });

    it('should return empty array when no active products', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.getProductPerformance(orgId);

      expect(result).toEqual([]);
    });

    it('should use default limit of 10', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await service.getProductPerformance(orgId);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });

    it('should accept custom limit', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await service.getProductPerformance(orgId, 5);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it('should set margin to 0 when salePrice is zero', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1', name: 'Free Product', sku: 'SKU-000',
          salePrice: 0, costPrice: 10, stockQuantity: 100, minStock: 1,
        },
      ]);

      const result = await service.getProductPerformance(orgId);

      expect(result[0].margin).toBe(0);
    });

    it('should handle negative margin (cost > sale)', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1', name: 'Loss Leader', sku: 'SKU-LL',
          salePrice: 50, costPrice: 60, stockQuantity: 20, minStock: 5,
        },
      ]);

      const result = await service.getProductPerformance(orgId);

      expect(result[0].margin).toBe(-20);
    });

    it('should round margin to 2 decimal places', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1', name: 'Precise', sku: 'SKU-P',
          salePrice: 100, costPrice: 33.33, stockQuantity: 10, minStock: 1,
        },
      ]);

      const result = await service.getProductPerformance(orgId);

      expect(result[0].margin).toBe(66.67);
    });

    it('should order products by stockQuantity ascending', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await service.getProductPerformance(orgId);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { stockQuantity: 'asc' } }),
      );
    });

    it('should filter by organizationId and isActive', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await service.getProductPerformance(orgId);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId, isActive: true },
        }),
      );
    });
  });
});
