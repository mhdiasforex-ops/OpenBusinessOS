import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './products.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;
  let eventBus: any;

  beforeEach(() => {
    prisma = {
      product: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) };
    service = new ProductsService(prisma, eventBus);
  });

  const orgId = 'org-123';

  describe('createProduct', () => {
    const dto: CreateProductDto = {
      name: 'Produto A',
      sku: 'SKU-001',
      costPrice: 50,
      salePrice: 100,
    };

    it('should create a product successfully', async () => {
      prisma.product.findFirst.mockResolvedValue(null); // no existing SKU
      prisma.product.create.mockResolvedValue({
        id: 'prod-1',
        ...dto,
        organizationId: orgId,
        stockQuantity: 0,
        minStock: 5,
      });

      const result = await service.createProduct(orgId, dto);

      expect(prisma.product.create).toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalled(); // STOCK_LOW event
    });

    it('should throw ConflictException for duplicate SKU', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'existing', sku: 'SKU-001' });

      await expect(service.createProduct(orgId, dto)).rejects.toThrow();
    });

    it('should NOT emit STOCK_LOW when stock is above minimum', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue({
        id: 'prod-1',
        ...dto,
        organizationId: orgId,
        stockQuantity: 50,
        minStock: 5,
      });

      await service.createProduct(orgId, { ...dto, stockQuantity: 50 });

      // eventBus.emit should not have been called for STOCK_LOW
      const emitCalls = eventBus.emit.mock.calls;
      const stockLowCalls = emitCalls.filter((c: any) => c[0]?.type === 'STOCK_LOW');
      expect(stockLowCalls).toHaveLength(0);
    });
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      prisma.product.findMany.mockResolvedValue([{ id: 'prod-1' }]);
      prisma.product.count.mockResolvedValue(15);

      const result = await service.getProducts(orgId, { page: 1, perPage: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(15);
    });

    it('should filter by category', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.getProducts(orgId, { category: 'Eletrônicos' });

      const call = prisma.product.findMany.mock.calls[0][0];
      expect(call.where.category).toBe('Eletrônicos');
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', organizationId: orgId });
      prisma.product.update.mockResolvedValue({ id: 'prod-1', name: 'Updated' });

      const result = await service.updateProduct(orgId, 'prod-1', { name: 'Updated' } as UpdateProductDto);

      expect(prisma.product.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent product', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.updateProduct(orgId, 'prod-999', {} as UpdateProductDto)).rejects.toThrow();
    });
  });

  describe('deleteProduct', () => {
    it('should soft-delete an existing product', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', organizationId: orgId });
      prisma.product.update.mockResolvedValue({ id: 'prod-1', isActive: false });

      await service.deleteProduct(orgId, 'prod-1');
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException for non-existent product', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.deleteProduct(orgId, 'prod-999')).rejects.toThrow();
    });
  });
});
