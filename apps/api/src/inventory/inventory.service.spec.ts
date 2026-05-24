import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { EventTypes } from '@openbusinessos/event-definitions';
import { StockMovementType, PurchaseOrderStatus } from './inventory.dto';
import { NotFoundException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: any;
  let eventBus: any;

  const orgId = 'org-123';
  const userId = 'user-1';

  beforeEach(() => {
    prisma = {
      $transaction: vi.fn().mockImplementation((queries: any[]) => Promise.all(queries)),
      $queryRaw: vi.fn(),
      product: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      supplier: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      purchaseOrder: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    };
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) };
    service = new InventoryService(
      prisma as unknown as PrismaService,
      eventBus as unknown as EventBusService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Stock Movements ────────────────────────────────────────────────

  describe('createMovement', () => {
    const baseDto = {
      productId: 'prod-1',
      quantity: 10,
      reason: 'Test movement',
      reference: 'REF-001',
      costPrice: 25.5,
    };

    const product = {
      id: 'prod-1',
      name: 'Produto Teste',
      organizationId: orgId,
      stockQuantity: 50,
      minStock: 5,
      sku: 'SKU-001',
    };

    const movement = {
      id: 'mov-1',
      organizationId: orgId,
      productId: 'prod-1',
      type: StockMovementType.IN,
      quantity: 10,
      reason: 'Test movement',
      reference: 'REF-001',
      costPrice: 25.5,
      createdAt: new Date(),
    };

    it('should throw NotFoundException when product does not exist', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.createMovement(orgId, { ...baseDto, type: StockMovementType.IN }, userId),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: 'prod-1', organizationId: orgId },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalled();
    });

    it('should calculate delta as +quantity for IN type', async () => {
      prisma.product.findFirst.mockResolvedValue({ ...product, stockQuantity: 50, minStock: 0 });
      const createdMovement = { ...movement, type: StockMovementType.IN, quantity: 10 };
      prisma.stockMovement.create.mockResolvedValue(createdMovement);
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 60 });

      const result = await service.createMovement(orgId, { ...baseDto, type: StockMovementType.IN }, userId);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stockQuantity: 60 },
      });
      expect(result).toEqual(createdMovement);
    });

    it('should calculate delta as -quantity for OUT type', async () => {
      prisma.product.findFirst.mockResolvedValue({ ...product, stockQuantity: 50, minStock: 0 });
      const createdMovement = { ...movement, type: StockMovementType.OUT, quantity: 10 };
      prisma.stockMovement.create.mockResolvedValue(createdMovement);
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 40 });

      const result = await service.createMovement(orgId, { ...baseDto, type: StockMovementType.OUT }, userId);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stockQuantity: 40 },
      });
      expect(result).toEqual(createdMovement);
    });

    it('should calculate delta as +quantity for RETURN type', async () => {
      prisma.product.findFirst.mockResolvedValue({ ...product, stockQuantity: 30, minStock: 0 });
      const createdMovement = { ...movement, type: StockMovementType.RETURN, quantity: 5 };
      prisma.stockMovement.create.mockResolvedValue(createdMovement);
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 35 });

      const result = await service.createMovement(orgId, { ...baseDto, type: StockMovementType.RETURN, quantity: 5 }, userId);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stockQuantity: 35 },
      });
      expect(result).toEqual(createdMovement);
    });

    it('should calculate delta as quantity for ADJUSTMENT type (positive increase)', async () => {
      prisma.product.findFirst.mockResolvedValue({ ...product, stockQuantity: 50, minStock: 0 });
      const createdMovement = { ...movement, type: StockMovementType.ADJUSTMENT, quantity: 5 };
      prisma.stockMovement.create.mockResolvedValue(createdMovement);
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 55 });

      await service.createMovement(orgId, { ...baseDto, type: StockMovementType.ADJUSTMENT, quantity: 5 }, userId);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stockQuantity: 55 },
      });
    });

    it('should calculate delta as quantity for ADJUSTMENT type (negative decrease)', async () => {
      prisma.product.findFirst.mockResolvedValue({ ...product, stockQuantity: 50, minStock: 0 });
      const createdMovement = { ...movement, type: StockMovementType.ADJUSTMENT, quantity: -8 };
      prisma.stockMovement.create.mockResolvedValue(createdMovement);
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 42 });

      await service.createMovement(orgId, { ...baseDto, type: StockMovementType.ADJUSTMENT, quantity: -8 }, userId);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stockQuantity: 42 },
      });
    });

    it('should calculate delta as -quantity for TRANSFER type (outbound)', async () => {
      prisma.product.findFirst.mockResolvedValue({ ...product, stockQuantity: 100, minStock: 0 });
      const createdMovement = { ...movement, type: StockMovementType.TRANSFER, quantity: 20 };
      prisma.stockMovement.create.mockResolvedValue(createdMovement);
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 80 });

      await service.createMovement(orgId, { ...baseDto, type: StockMovementType.TRANSFER, quantity: 20 }, userId);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stockQuantity: 80 },
      });
    });

    it('should create stockMovement and update product within $transaction', async () => {
      prisma.product.findFirst.mockResolvedValue(product);
      const createdMovement = { ...movement, type: StockMovementType.IN };
      prisma.stockMovement.create.mockResolvedValue(createdMovement);
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 60 });

      await service.createMovement(orgId, { ...baseDto, type: StockMovementType.IN }, userId);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const transactionArgs = prisma.$transaction.mock.calls[0][0];
      expect(Array.isArray(transactionArgs)).toBe(true);
      expect(transactionArgs).toHaveLength(2);
    });

    it('should emit STOCK_LOW event when new stock <= minStock', async () => {
      prisma.product.findFirst.mockResolvedValue({ ...product, stockQuantity: 12, minStock: 10 });
      prisma.stockMovement.create.mockResolvedValue({ ...movement, type: StockMovementType.OUT, quantity: 5 });
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 7 });

      await service.createMovement(orgId, { ...baseDto, type: StockMovementType.OUT, quantity: 5 }, userId);

      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.STOCK_LOW,
          organizationId: orgId,
          source: 'inventory-service',
          payload: expect.objectContaining({
            productId: 'prod-1',
            productName: 'Produto Teste',
            currentStock: 7,
            minStock: 10,
          }),
        }),
      );
    });

    it('should emit STOCK_LOW event when stock goes exactly to minStock', async () => {
      prisma.product.findFirst.mockResolvedValue({ ...product, stockQuantity: 15, minStock: 10 });
      prisma.stockMovement.create.mockResolvedValue(movement);
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 10 });

      await service.createMovement(orgId, { ...baseDto, type: StockMovementType.OUT, quantity: 5 }, userId);

      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: EventTypes.STOCK_LOW }),
      );
    });

    it('should emit STOCK_OUT event when new stock === 0', async () => {
      prisma.product.findFirst.mockResolvedValue({ ...product, stockQuantity: 5, minStock: 3 });
      prisma.stockMovement.create.mockResolvedValue(movement);
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 0 });

      await service.createMovement(orgId, { ...baseDto, type: StockMovementType.OUT, quantity: 5 }, userId);

      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.STOCK_OUT,
          organizationId: orgId,
          source: 'inventory-service',
          payload: expect.objectContaining({
            productId: 'prod-1',
            productName: 'Produto Teste',
          }),
        }),
      );
    });

    it('should emit both STOCK_LOW and STOCK_OUT when stock hits 0 and minStock >= 0', async () => {
      prisma.product.findFirst.mockResolvedValue({ ...product, stockQuantity: 3, minStock: 5 });
      prisma.stockMovement.create.mockResolvedValue(movement);
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 0 });

      await service.createMovement(orgId, { ...baseDto, type: StockMovementType.OUT, quantity: 3 }, userId);

      const stockLowCalls = eventBus.emit.mock.calls.filter(
        (c: any[]) => c[0].type === EventTypes.STOCK_LOW,
      );
      const stockOutCalls = eventBus.emit.mock.calls.filter(
        (c: any[]) => c[0].type === EventTypes.STOCK_OUT,
      );
      expect(stockLowCalls).toHaveLength(1);
      expect(stockOutCalls).toHaveLength(1);
    });

    it('should emit STOCK_MOVEMENT_CREATED event', async () => {
      prisma.product.findFirst.mockResolvedValue(product);
      const createdMovement = { ...movement, id: 'mov-123', type: StockMovementType.IN, quantity: 10 };
      prisma.stockMovement.create.mockResolvedValue(createdMovement);
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 60 });

      await service.createMovement(orgId, { ...baseDto, type: StockMovementType.IN, quantity: 10 }, userId);

      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'STOCK_MOVEMENT_CREATED',
          organizationId: orgId,
          source: 'inventory-service',
          payload: {
            movementId: 'mov-123',
            productId: 'prod-1',
            type: StockMovementType.IN,
            quantity: 10,
          },
        }),
      );
    });

    it('should not emit STOCK_LOW when stock is above minStock', async () => {
      prisma.product.findFirst.mockResolvedValue({ ...product, stockQuantity: 50, minStock: 5 });
      prisma.stockMovement.create.mockResolvedValue(movement);
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 60 });

      await service.createMovement(orgId, { ...baseDto, type: StockMovementType.IN, quantity: 10 }, userId);

      const stockLowCalls = eventBus.emit.mock.calls.filter(
        (c: any[]) => c[0].type === EventTypes.STOCK_LOW,
      );
      expect(stockLowCalls).toHaveLength(0);
    });

    it('should not emit STOCK_OUT when stock is above 0', async () => {
      prisma.product.findFirst.mockResolvedValue({ ...product, stockQuantity: 50, minStock: 5 });
      prisma.stockMovement.create.mockResolvedValue(movement);
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 40 });

      await service.createMovement(orgId, { ...baseDto, type: StockMovementType.OUT, quantity: 10 }, userId);

      const stockOutCalls = eventBus.emit.mock.calls.filter(
        (c: any[]) => c[0].type === EventTypes.STOCK_OUT,
      );
      expect(stockOutCalls).toHaveLength(0);
    });

    it('should always emit STOCK_MOVEMENT_CREATED (even with zero delta)', async () => {
      prisma.product.findFirst.mockResolvedValue({ ...product, stockQuantity: 50, minStock: 0 });
      prisma.stockMovement.create.mockResolvedValue(movement);
      prisma.product.update.mockResolvedValue({ ...product, stockQuantity: 50 });

      await service.createMovement(orgId, { ...baseDto, type: StockMovementType.ADJUSTMENT, quantity: 0 }, userId);

      const createdCalls = eventBus.emit.mock.calls.filter(
        (c: any[]) => c[0].type === 'STOCK_MOVEMENT_CREATED',
      );
      expect(createdCalls).toHaveLength(1);
    });
  });

  describe('getMovements', () => {
    it('should return paginated movements with default page and perPage', async () => {
      const movements = [{ id: 'mov-1', product: { name: 'Prod', sku: 'SKU' } }];
      prisma.stockMovement.findMany.mockResolvedValue(movements);
      prisma.stockMovement.count.mockResolvedValue(1);

      const result = await service.getMovements(orgId, {});

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        include: { product: { select: { name: true, sku: true } } },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
      });
      expect(prisma.stockMovement.count).toHaveBeenCalledWith({
        where: { organizationId: orgId },
      });
      expect(result).toEqual({ data: movements, total: 1, page: 1, perPage: 50 });
    });

    it('should apply productId and type filters', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([]);
      prisma.stockMovement.count.mockResolvedValue(0);

      await service.getMovements(orgId, { productId: 'prod-1', type: 'IN', page: 2, perPage: 10 });

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId, productId: 'prod-1', type: 'IN' },
        include: { product: { select: { name: true, sku: true } } },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
    });

    it('should cap perPage at 100', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([]);
      prisma.stockMovement.count.mockResolvedValue(0);

      await service.getMovements(orgId, { perPage: 500 });

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should apply correct pagination skip for page 3 with 20 perPage', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([]);
      prisma.stockMovement.count.mockResolvedValue(0);

      await service.getMovements(orgId, { page: 3, perPage: 20 });

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
    });

    it('should return empty data when no movements exist', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([]);
      prisma.stockMovement.count.mockResolvedValue(0);

      const result = await service.getMovements(orgId, {});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getLowStock', () => {
    it('should use $queryRaw to find products with stock <= min_stock', async () => {
      const lowStockProducts = [
        { id: 'prod-1', name: 'Produto Baixo', stock_quantity: 2, min_stock: 5 },
      ];
      prisma.$queryRaw.mockResolvedValue(lowStockProducts);

      const result = await service.getLowStock(orgId);

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(result).toEqual(lowStockProducts);
    });

    it('should order results by stock_quantity ascending', async () => {
      const products = [
        { id: 'prod-1', stock_quantity: 0, min_stock: 5 },
        { id: 'prod-2', stock_quantity: 3, min_stock: 10 },
      ];
      prisma.$queryRaw.mockResolvedValue(products);

      const result = await service.getLowStock(orgId);

      expect(result[0].stock_quantity).toBe(0);
      expect(result[1].stock_quantity).toBe(3);
    });
  });

  // ── Suppliers ──────────────────────────────────────────────────────

  describe('createSupplier', () => {
    it('should create a supplier with provided data', async () => {
      const dto = {
        name: 'Fornecedor ABC',
        email: 'contato@abc.com',
        phone: '11999999999',
        document: '12.345.678/0001-90',
        address: { street: 'Rua A', city: 'SP' },
        notes: 'Fornecedor confiável',
      };
      const created = { id: 'sup-1', organizationId: orgId, ...dto, address: dto.address, isActive: true };
      prisma.supplier.create.mockResolvedValue(created);

      const result = await service.createSupplier(orgId, dto);

      expect(prisma.supplier.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          name: 'Fornecedor ABC',
          email: 'contato@abc.com',
          phone: '11999999999',
          document: '12.345.678/0001-90',
          address: { street: 'Rua A', city: 'SP' },
          notes: 'Fornecedor confiável',
        },
      });
      expect(result).toEqual(created);
    });

    it('should default address to empty object when not provided', async () => {
      const dto = { name: 'Fornecedor' };
      prisma.supplier.create.mockResolvedValue({ id: 'sup-1', organizationId: orgId, name: 'Fornecedor', address: {} });

      await service.createSupplier(orgId, dto);

      expect(prisma.supplier.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ address: {} }),
      });
    });
  });

  describe('getSuppliers', () => {
    it('should return paginated suppliers with default values', async () => {
      const suppliers = [{ id: 'sup-1', name: 'Fornecedor A' }];
      prisma.supplier.findMany.mockResolvedValue(suppliers);
      prisma.supplier.count.mockResolvedValue(1);

      const result = await service.getSuppliers(orgId, {});

      expect(prisma.supplier.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { name: 'asc' },
        skip: 0,
        take: 50,
      });
      expect(result).toEqual({ data: suppliers, total: 1, page: 1, perPage: 50 });
    });

    it('should filter by isActive when provided', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      await service.getSuppliers(orgId, { isActive: false });

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: orgId, isActive: false } }),
      );
    });

    it('should cap perPage at 100', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      await service.getSuppliers(orgId, { perPage: 200 });

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });

  describe('getSupplier', () => {
    it('should return supplier when found', async () => {
      const supplier = { id: 'sup-1', organizationId: orgId, name: 'Fornecedor A' };
      prisma.supplier.findFirst.mockResolvedValue(supplier);

      const result = await service.getSupplier(orgId, 'sup-1');

      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'sup-1', organizationId: orgId },
      });
      expect(result).toEqual(supplier);
    });

    it('should throw NotFoundException when supplier does not exist', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);

      await expect(service.getSupplier(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when supplier belongs to another org', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);

      await expect(service.getSupplier(orgId, 'sup-other-org')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSupplier', () => {
    it('should verify supplier exists then perform partial update', async () => {
      const existing = { id: 'sup-1', organizationId: orgId, name: 'Fornecedor A', isActive: true };
      prisma.supplier.findFirst.mockResolvedValue(existing);
      prisma.supplier.update.mockResolvedValue({ ...existing, name: 'Fornecedor B', email: 'novo@email.com' });

      const result = await service.updateSupplier(orgId, 'sup-1', {
        name: 'Fornecedor B',
        email: 'novo@email.com',
      });

      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'sup-1', organizationId: orgId },
      });
      expect(prisma.supplier.update).toHaveBeenCalledWith({
        where: { id: 'sup-1' },
        data: {
          name: 'Fornecedor B',
          email: 'novo@email.com',
          phone: undefined,
          document: undefined,
          address: undefined,
          notes: undefined,
          isActive: undefined,
        },
      });
      expect(result.name).toBe('Fornecedor B');
      expect(result.email).toBe('novo@email.com');
    });

    it('should throw NotFoundException when supplier does not exist (getSupplier guard)', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSupplier(orgId, 'nonexistent', { name: 'Novo Nome' }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.supplier.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteSupplier', () => {
    it('should verify supplier exists then delete it', async () => {
      const supplier = { id: 'sup-1', organizationId: orgId, name: 'Fornecedor A' };
      prisma.supplier.findFirst.mockResolvedValue(supplier);
      prisma.supplier.delete.mockResolvedValue(supplier);

      const result = await service.deleteSupplier(orgId, 'sup-1');

      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'sup-1', organizationId: orgId },
      });
      expect(prisma.supplier.delete).toHaveBeenCalledWith({ where: { id: 'sup-1' } });
      expect(result).toEqual(supplier);
    });

    it('should throw NotFoundException when supplier does not exist', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);

      await expect(service.deleteSupplier(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(prisma.supplier.delete).not.toHaveBeenCalled();
    });
  });

  // ── Purchase Orders ────────────────────────────────────────────────

  describe('createPurchaseOrder', () => {
    const poDto = {
      supplierId: 'sup-1',
      notes: 'Urgente',
      expectedAt: '2026-07-15',
      items: [
        { productId: 'prod-1', quantity: 10, unitPrice: 25.5 },
        { productId: 'prod-2', quantity: 5, unitPrice: 100 },
      ],
    };

    it('should verify supplier exists, generate PO number, calculate totals, and create', async () => {
      const supplier = { id: 'sup-1', organizationId: orgId, name: 'Fornecedor A' };
      prisma.supplier.findFirst.mockResolvedValue(supplier);
      prisma.purchaseOrder.count.mockResolvedValue(0);
      const createdPO = {
        id: 'po-1',
        organizationId: orgId,
        supplierId: 'sup-1',
        number: 'PO-00001',
        status: PurchaseOrderStatus.DRAFT,
        items: [
          { productId: 'prod-1', quantity: 10, unitPrice: 25.5, total: 255 },
          { productId: 'prod-2', quantity: 5, unitPrice: 100, total: 500 },
        ],
        total: 755,
        notes: 'Urgente',
        expectedAt: new Date('2026-07-15'),
      };
      prisma.purchaseOrder.create.mockResolvedValue(createdPO);

      const result = await service.createPurchaseOrder(orgId, poDto);

      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'sup-1', organizationId: orgId },
      });
      expect(prisma.purchaseOrder.count).toHaveBeenCalledWith({
        where: { organizationId: orgId },
      });
      expect(prisma.purchaseOrder.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          supplierId: 'sup-1',
          number: 'PO-00001',
          status: PurchaseOrderStatus.DRAFT,
          items: [
            { productId: 'prod-1', quantity: 10, unitPrice: 25.5, total: 255 },
            { productId: 'prod-2', quantity: 5, unitPrice: 100, total: 500 },
          ],
          total: 755,
          notes: 'Urgente',
          expectedAt: new Date('2026-07-15'),
        },
      });
      expect(result.number).toBe('PO-00001');
      expect(result.total).toBe(755);
    });

    it('should generate sequential PO numbers', async () => {
      prisma.supplier.findFirst.mockResolvedValue({ id: 'sup-1', organizationId: orgId });
      prisma.purchaseOrder.count.mockResolvedValue(5);
      prisma.purchaseOrder.create.mockResolvedValue({} as any);

      await service.createPurchaseOrder(orgId, poDto);

      expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ number: 'PO-00006' }) }),
      );
    });

    it('should pad PO number with leading zeros', async () => {
      prisma.supplier.findFirst.mockResolvedValue({ id: 'sup-1', organizationId: orgId });
      prisma.purchaseOrder.count.mockResolvedValue(123);
      prisma.purchaseOrder.create.mockResolvedValue({} as any);

      await service.createPurchaseOrder(orgId, poDto);

      expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ number: 'PO-00124' }) }),
      );
    });

    it('should set expectedAt to null when not provided', async () => {
      prisma.supplier.findFirst.mockResolvedValue({ id: 'sup-1', organizationId: orgId });
      prisma.purchaseOrder.count.mockResolvedValue(0);
      prisma.purchaseOrder.create.mockResolvedValue({} as any);

      await service.createPurchaseOrder(orgId, { supplierId: 'sup-1', items: [{ productId: 'prod-1', quantity: 1, unitPrice: 10 }] });

      expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ expectedAt: null }),
        }),
      );
    });

    it('should throw when supplier does not exist', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);

      await expect(service.createPurchaseOrder(orgId, poDto)).rejects.toThrow(NotFoundException);
      expect(prisma.purchaseOrder.create).not.toHaveBeenCalled();
    });

    it('should correctly calculate item totals and sum', async () => {
      prisma.supplier.findFirst.mockResolvedValue({ id: 'sup-1', organizationId: orgId });
      prisma.purchaseOrder.count.mockResolvedValue(0);
      prisma.purchaseOrder.create.mockImplementation((_: any) => Promise.resolve(_.data));

      const result = await service.createPurchaseOrder(orgId, poDto);

      expect(result.items[0].total).toBe(255);
      expect(result.items[1].total).toBe(500);
      expect(result.total).toBe(755);
    });
  });

  describe('getPurchaseOrders', () => {
    it('should return paginated purchase orders with default values', async () => {
      const orders = [{ id: 'po-1', supplier: { name: 'Fornecedor A' } }];
      prisma.purchaseOrder.findMany.mockResolvedValue(orders);
      prisma.purchaseOrder.count.mockResolvedValue(1);

      const result = await service.getPurchaseOrders(orgId, {});

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        include: { supplier: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
      });
      expect(result).toEqual({ data: orders, total: 1, page: 1, perPage: 50 });
    });

    it('should filter by status and supplierId', async () => {
      prisma.purchaseOrder.findMany.mockResolvedValue([]);
      prisma.purchaseOrder.count.mockResolvedValue(0);

      await service.getPurchaseOrders(orgId, {
        status: 'SENT',
        supplierId: 'sup-1',
        page: 2,
        perPage: 10,
      });

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId, status: 'SENT', supplierId: 'sup-1' },
        include: { supplier: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
    });

    it('should cap perPage at 100', async () => {
      prisma.purchaseOrder.findMany.mockResolvedValue([]);
      prisma.purchaseOrder.count.mockResolvedValue(0);

      await service.getPurchaseOrders(orgId, { perPage: 999 });

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });

  describe('updatePurchaseOrderStatus', () => {
    it('should update status when PO exists', async () => {
      const existing = { id: 'po-1', organizationId: orgId, status: PurchaseOrderStatus.DRAFT };
      const updated = { ...existing, status: PurchaseOrderStatus.SENT };
      prisma.purchaseOrder.findFirst.mockResolvedValue(existing);
      prisma.purchaseOrder.update.mockResolvedValue(updated);

      const result = await service.updatePurchaseOrderStatus(orgId, 'po-1', PurchaseOrderStatus.SENT);

      expect(prisma.purchaseOrder.findFirst).toHaveBeenCalledWith({
        where: { id: 'po-1', organizationId: orgId },
      });
      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: { status: PurchaseOrderStatus.SENT },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when PO does not exist', async () => {
      prisma.purchaseOrder.findFirst.mockResolvedValue(null);

      await expect(
        service.updatePurchaseOrderStatus(orgId, 'nonexistent', PurchaseOrderStatus.CONFIRMED),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.purchaseOrder.update).not.toHaveBeenCalled();
    });

    it('should throw when PO belongs to another org', async () => {
      prisma.purchaseOrder.findFirst.mockResolvedValue(null);

      await expect(
        service.updatePurchaseOrderStatus(orgId, 'po-other-org', PurchaseOrderStatus.RECEIVED),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
