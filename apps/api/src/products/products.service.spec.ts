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

  describe('getProduct', () => {
    it('should return product with transaction items', async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Produto A',
        sku: 'SKU-001',
        transactionItems: [{ id: 'ti-1', quantity: 2 }],
      });

      const result = await service.getProduct(orgId, 'prod-1');
      expect(result.name).toBe('Produto A');
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: 'prod-1', organizationId: orgId },
        include: { transactionItems: { take: 10, orderBy: { createdAt: 'desc' } } },
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.getProduct(orgId, 'prod-999')).rejects.toThrow('Produto não encontrado');
    });
  });

  describe('adjustStock', () => {
    it('should increase stock and return new quantity', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', name: 'Produto A', sku: 'SKU-001', stockQuantity: 10, minStock: 5, organizationId: orgId });
      prisma.product.update.mockResolvedValue({ id: 'prod-1', stockQuantity: 20, minStock: 5, name: 'Produto A', sku: 'SKU-001' });

      const result = await service.adjustStock(orgId, 'prod-1', 10, 'reposição');
      expect(result.stockQuantity).toBe(20);
      expect(result.adjusted).toBe(10);
    });

    it('should decrease stock and return new quantity', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', name: 'Produto A', sku: 'SKU-001', stockQuantity: 10, minStock: 5, organizationId: orgId });
      prisma.product.update.mockResolvedValue({ id: 'prod-1', stockQuantity: 7, minStock: 5, name: 'Produto A', sku: 'SKU-001' });

      const result = await service.adjustStock(orgId, 'prod-1', -3, 'venda');
      expect(result.stockQuantity).toBe(7);
    });

    it('should throw ConflictException when stock would go negative', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', stockQuantity: 3, minStock: 5, organizationId: orgId });

      await expect(service.adjustStock(orgId, 'prod-1', -10, 'perda')).rejects.toThrow('Estoque não pode ficar negativo');
    });

    it('should throw NotFoundException when product not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.adjustStock(orgId, 'prod-999', 5, 'test')).rejects.toThrow('Produto não encontrado');
    });

    it('should emit STOCK_LOW when stock goes below minimum', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', name: 'Produto A', sku: 'SKU-001', stockQuantity: 5, minStock: 5, organizationId: orgId });
      prisma.product.update.mockResolvedValue({ id: 'prod-1', stockQuantity: 2, minStock: 5, name: 'Produto A', sku: 'SKU-001' });

      await service.adjustStock(orgId, 'prod-1', -3, 'venda');
      expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'STOCK_LOW',
        source: 'products-service',
      }));
    });

    it('should NOT emit STOCK_LOW when stock is above minimum', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', name: 'Produto A', sku: 'SKU-001', stockQuantity: 20, minStock: 5, organizationId: orgId });
      prisma.product.update.mockResolvedValue({ id: 'prod-1', stockQuantity: 25, minStock: 5, name: 'Produto A', sku: 'SKU-001' });

      await service.adjustStock(orgId, 'prod-1', 5, 'reposição');
      const emitCalls = eventBus.emit.mock.calls.filter((c: any) => c[0]?.type === 'STOCK_LOW');
      expect(emitCalls).toHaveLength(0);
    });
  });
});
