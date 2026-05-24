import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto, SupplierFiltersDto } from './suppliers.dto';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let prisma: any;
  let eventBus: any;

  const orgId = 'org-123';

  beforeEach(() => {
    prisma = {
      supplier: {
        findFirst: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
    };
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) };
    service = new SuppliersService(prisma, eventBus);
  });

  // ──────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────

  describe('createSupplier', () => {
    const dto: CreateSupplierDto = {
      name: 'Distribuidora ABC Ltda',
      email: 'contato@distribuidoraabc.com',
      phone: '(11) 3333-4444',
      document: '12.345.678/0001-90',
      address: { street: 'Rua das Indústrias, 500', city: 'São Paulo', state: 'SP' },
      notes: 'Entrega em 48h',
    };

    it('should create a supplier successfully', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      const createdSupplier = {
        id: 'supplier-1',
        organizationId: orgId,
        ...dto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.supplier.create.mockResolvedValue(createdSupplier);

      const result = await service.createSupplier(orgId, dto);

      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: { organizationId: orgId, document: dto.document },
      });
      expect(prisma.supplier.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          document: dto.document,
          address: dto.address,
          notes: dto.notes,
          isActive: true,
        },
      });
      expect(result).toEqual(createdSupplier);
    });

    it('should create a supplier with minimal fields', async () => {
      const minimalDto: CreateSupplierDto = { name: 'Fornecedor Simples' };
      prisma.supplier.findFirst.mockResolvedValue(null);
      prisma.supplier.create.mockResolvedValue({
        id: 'supplier-2',
        organizationId: orgId,
        name: 'Fornecedor Simples',
        email: null,
        phone: null,
        document: null,
        address: {},
        notes: null,
        isActive: true,
      });

      await service.createSupplier(orgId, minimalDto);

      expect(prisma.supplier.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          name: 'Fornecedor Simples',
          email: null,
          phone: null,
          document: null,
          address: {},
          notes: null,
          isActive: true,
        },
      });
    });

    it('should set isActive to false when explicitly passed false', async () => {
      const inactiveDto: CreateSupplierDto = { name: 'Inactive Supplier', isActive: false };
      prisma.supplier.findFirst.mockResolvedValue(null);
      prisma.supplier.create.mockResolvedValue({
        id: 'supplier-3',
        organizationId: orgId,
        name: 'Inactive Supplier',
        isActive: false,
      });

      await service.createSupplier(orgId, inactiveDto);

      expect(prisma.supplier.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });

    it('should throw ConflictException when document already exists in the same organization', async () => {
      prisma.supplier.findFirst.mockResolvedValue({ id: 'existing', document: dto.document });

      await expect(service.createSupplier(orgId, dto)).rejects.toThrow(ConflictException);
      await expect(service.createSupplier(orgId, dto)).rejects.toThrow(
        `CNPJ "${dto.document}" já existe nesta organização`,
      );
      expect(prisma.supplier.create).not.toHaveBeenCalled();
    });

    it('should skip document uniqueness check when document is not provided', async () => {
      const dtoNoDoc: CreateSupplierDto = { name: 'No Doc Supplier' };
      prisma.supplier.findFirst.mockResolvedValue(null);
      prisma.supplier.create.mockResolvedValue({
        id: 'supplier-4',
        organizationId: orgId,
        name: 'No Doc Supplier',
      });

      await service.createSupplier(orgId, dtoNoDoc);

      expect(prisma.supplier.findFirst).toHaveBeenCalledTimes(0);
    });

    it('should not check document uniqueness for different organizations', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      prisma.supplier.create.mockResolvedValue({
        id: 'supplier-5',
        organizationId: 'org-other',
        ...dto,
      });

      await service.createSupplier('org-other', dto);

      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: { organizationId: 'org-other', document: dto.document },
      });
    });

    it('should emit SUPPLIER_CREATED event', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      const createdSupplier = {
        id: 'supplier-1',
        organizationId: orgId,
        name: dto.name,
        document: dto.document,
        email: dto.email,
        isActive: true,
      };
      prisma.supplier.create.mockResolvedValue(createdSupplier);

      await service.createSupplier(orgId, dto);

      expect(eventBus.emit).toHaveBeenCalledTimes(1);
      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'SUPPLIER_CREATED',
        source: 'suppliers-service',
        payload: {
          supplierId: createdSupplier.id,
          name: createdSupplier.name,
          document: createdSupplier.document,
          email: createdSupplier.email,
        },
      });
    });

    it('should emit event even when optional fields are null', async () => {
      const dtoMinimal: CreateSupplierDto = { name: 'Minimal' };
      prisma.supplier.findFirst.mockResolvedValue(null);
      prisma.supplier.create.mockResolvedValue({
        id: 'supplier-6',
        organizationId: orgId,
        name: 'Minimal',
        document: null,
        email: null,
      });

      await service.createSupplier(orgId, dtoMinimal);

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'SUPPLIER_CREATED',
        source: 'suppliers-service',
        payload: {
          supplierId: 'supplier-6',
          name: 'Minimal',
          document: null,
          email: null,
        },
      });
    });
  });

  // ──────────────────────────────────────────────
  // LIST (getSuppliers)
  // ──────────────────────────────────────────────

  describe('getSuppliers', () => {
    it('should return paginated suppliers with default pagination', async () => {
      const suppliers = Array.from({ length: 5 }, (_, i) => ({
        id: `supplier-${i}`,
        name: `Supplier ${i}`,
        _count: { contracts: 0, purchaseOrders: 0 },
      }));
      prisma.supplier.findMany.mockResolvedValue(suppliers);
      prisma.supplier.count.mockResolvedValue(25);

      const result = await service.getSuppliers(orgId, {});

      expect(prisma.supplier.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 25,
        include: { _count: { select: { contracts: true, purchaseOrders: true } } },
      });
      expect(prisma.supplier.count).toHaveBeenCalledWith({ where: { organizationId: orgId } });
      expect(result.data).toEqual(suppliers);
      expect(result.meta).toEqual({
        total: 25,
        page: 1,
        perPage: 25,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should apply custom pagination', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(50);

      const result = await service.getSuppliers(orgId, { page: 3, perPage: 10 });

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.meta.page).toBe(3);
      expect(result.meta.perPage).toBe(10);
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.hasNext).toBe(true);
      expect(result.meta.hasPrev).toBe(true);
    });

    it('should clamp page to minimum 1', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      await service.getSuppliers(orgId, { page: 0, perPage: 25 });

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0 }),
      );
    });

    it('should clamp perPage to maximum 100', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      await service.getSuppliers(orgId, { perPage: 999 });

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should default perPage to 25 when zero or invalid', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      await service.getSuppliers(orgId, { perPage: 0 });

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 25 }),
      );
    });

    it('should filter by isActive', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      await service.getSuppliers(orgId, { isActive: 'true' });

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should filter by isActive false', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      await service.getSuppliers(orgId, { isActive: 'false' });

      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: false }),
        }),
      );
    });

    it('should disregard isActive filter when value is empty string', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      await service.getSuppliers(orgId, { isActive: '' });

      const callWhere = prisma.supplier.findMany.mock.calls[0][0].where;
      expect(callWhere.isActive).toBeUndefined();
    });

    it('should disregard isActive filter when undefined', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      await service.getSuppliers(orgId, {});

      const callWhere = prisma.supplier.findMany.mock.calls[0][0].where;
      expect(callWhere.isActive).toBeUndefined();
    });

    it('should search by name using insensitive contains', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      await service.getSuppliers(orgId, { search: 'Distribuidora' });

      const callWhere = prisma.supplier.findMany.mock.calls[0][0].where;
      expect(callWhere.OR).toEqual(
        expect.arrayContaining([
          { name: { contains: 'Distribuidora', mode: 'insensitive' } },
        ]),
      );
    });

    it('should search by email using insensitive contains', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      await service.getSuppliers(orgId, { search: '@example.com' });

      const callWhere = prisma.supplier.findMany.mock.calls[0][0].where;
      expect(callWhere.OR).toEqual(
        expect.arrayContaining([
          { email: { contains: '@example.com', mode: 'insensitive' } },
        ]),
      );
    });

    it('should search by document using contains', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      await service.getSuppliers(orgId, { search: '12.345.678' });

      const callWhere = prisma.supplier.findMany.mock.calls[0][0].where;
      expect(callWhere.OR).toEqual(
        expect.arrayContaining([
          { document: { contains: '12.345.678' } },
        ]),
      );
    });

    it('should search by phone using contains', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      await service.getSuppliers(orgId, { search: '(11) 3333' });

      const callWhere = prisma.supplier.findMany.mock.calls[0][0].where;
      expect(callWhere.OR).toEqual(
        expect.arrayContaining([
          { phone: { contains: '(11) 3333' } },
        ]),
      );
    });

    it('should combine isActive filter with search', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      await service.getSuppliers(orgId, { search: 'ABC', isActive: 'true' });

      const callWhere = prisma.supplier.findMany.mock.calls[0][0].where;
      expect(callWhere.isActive).toBe(true);
      expect(callWhere.OR).toBeDefined();
    });

    it('should compute correct metadata for empty results', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);
      prisma.supplier.count.mockResolvedValue(0);

      const result = await service.getSuppliers(orgId, { page: 1, perPage: 25 });

      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        perPage: 25,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should compute hasNext correctly', async () => {
      prisma.supplier.findMany.mockResolvedValue(Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}` })));
      prisma.supplier.count.mockResolvedValue(35);

      const result = await service.getSuppliers(orgId, { page: 2, perPage: 10 });

      expect(result.meta.hasNext).toBe(true);
      expect(result.meta.hasPrev).toBe(true);
    });

    it('should compute hasNext false on last page', async () => {
      prisma.supplier.findMany.mockResolvedValue(Array.from({ length: 5 }, (_, i) => ({ id: `s-${i}` })));
      prisma.supplier.count.mockResolvedValue(25);

      const result = await service.getSuppliers(orgId, { page: 3, perPage: 10 });

      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrev).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // GET ONE (getSupplier)
  // ──────────────────────────────────────────────

  describe('getSupplier', () => {
    it('should return a supplier with contracts and purchaseOrders', async () => {
      const mockSupplier = {
        id: 'supplier-1',
        name: 'Distribuidora ABC',
        contracts: [
          { id: 'contract-1', title: 'Contrato 1', createdAt: new Date() },
        ],
        purchaseOrders: [
          { id: 'po-1', number: 'PO-001', createdAt: new Date() },
        ],
        _count: { contracts: 1, purchaseOrders: 1 },
      };
      prisma.supplier.findFirst.mockResolvedValue(mockSupplier);

      const result = await service.getSupplier(orgId, 'supplier-1');

      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'supplier-1', organizationId: orgId },
        include: {
          contracts: { orderBy: { createdAt: 'desc' }, take: 20 },
          purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 20 },
          _count: { select: { contracts: true, purchaseOrders: true } },
        },
      });
      expect(result).toEqual(mockSupplier);
    });

    it('should throw NotFoundException when supplier does not exist', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);

      await expect(service.getSupplier(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.getSupplier(orgId, 'nonexistent')).rejects.toThrow(
        'Fornecedor não encontrado',
      );
    });

    it('should return empty arrays for contracts and purchaseOrders when none exist', async () => {
      prisma.supplier.findFirst.mockResolvedValue({
        id: 'supplier-1',
        name: 'Empty Supplier',
        contracts: [],
        purchaseOrders: [],
        _count: { contracts: 0, purchaseOrders: 0 },
      });

      const result = await service.getSupplier(orgId, 'supplier-1');

      expect(result.contracts).toHaveLength(0);
      expect(result.purchaseOrders).toHaveLength(0);
      expect(result._count.contracts).toBe(0);
      expect(result._count.purchaseOrders).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────

  describe('updateSupplier', () => {
    const existingSupplier = {
      id: 'supplier-1',
      organizationId: orgId,
      name: 'Distribuidora ABC Ltda',
      document: '12.345.678/0001-90',
      email: 'old@email.com',
      isActive: true,
    };

    it('should update a supplier successfully', async () => {
      prisma.supplier.findFirst.mockResolvedValue(existingSupplier);
      const updatedSupplier = { ...existingSupplier, name: 'Distribuidora ABC S.A.' };
      prisma.supplier.update.mockResolvedValue(updatedSupplier);

      const result = await service.updateSupplier(orgId, 'supplier-1', {
        name: 'Distribuidora ABC S.A.',
      } as UpdateSupplierDto);

      expect(prisma.supplier.update).toHaveBeenCalledWith({
        where: { id: 'supplier-1' },
        data: {
          name: 'Distribuidora ABC S.A.',
          email: undefined,
          phone: undefined,
          document: undefined,
          address: undefined,
          notes: undefined,
          isActive: undefined,
        },
      });
      expect(result).toEqual(updatedSupplier);
    });

    it('should throw NotFoundException when supplier does not exist', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSupplier(orgId, 'nonexistent', {} as UpdateSupplierDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should check document uniqueness when document is being changed', async () => {
      prisma.supplier.findFirst
        .mockResolvedValueOnce(existingSupplier) // first call: find existing
        .mockResolvedValueOnce(null); // second call: no duplicate
      prisma.supplier.update.mockResolvedValue({
        ...existingSupplier,
        document: '98.765.432/0001-10',
      });

      await service.updateSupplier(orgId, 'supplier-1', {
        document: '98.765.432/0001-10',
      } as UpdateSupplierDto);

      expect(prisma.supplier.findFirst).toHaveBeenNthCalledWith(2, {
        where: {
          organizationId: orgId,
          document: '98.765.432/0001-10',
          id: { not: 'supplier-1' },
        },
      });
    });

    it('should throw ConflictException when updated document already exists', async () => {
      prisma.supplier.findFirst
        .mockResolvedValueOnce(existingSupplier)
        .mockResolvedValueOnce({ id: 'other-supplier', document: '98.765.432/0001-10' });

      await expect(
        service.updateSupplier(orgId, 'supplier-1', {
          document: '98.765.432/0001-10',
        } as UpdateSupplierDto),
      ).rejects.toThrow(ConflictException);
      expect(prisma.supplier.update).not.toHaveBeenCalled();
    });

    it('should skip document uniqueness check when document is not being changed', async () => {
      prisma.supplier.findFirst.mockResolvedValue(existingSupplier);
      prisma.supplier.update.mockResolvedValue({
        ...existingSupplier,
        name: 'Updated Name',
      });

      await service.updateSupplier(orgId, 'supplier-1', {
        name: 'Updated Name',
        document: existingSupplier.document,
      } as UpdateSupplierDto);

      // findFirst should only have been called once (for existence check)
      expect(prisma.supplier.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should skip document uniqueness check when document is the same', async () => {
      prisma.supplier.findFirst.mockResolvedValue(existingSupplier);
      prisma.supplier.update.mockResolvedValue(existingSupplier);

      await service.updateSupplier(orgId, 'supplier-1', {
        document: existingSupplier.document,
      } as UpdateSupplierDto);

      expect(prisma.supplier.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should emit SUPPLIER_UPDATED event', async () => {
      const dto: UpdateSupplierDto = { name: 'Updated Name' };
      prisma.supplier.findFirst.mockResolvedValue(existingSupplier);
      prisma.supplier.update.mockResolvedValue({ ...existingSupplier, name: 'Updated Name' });

      await service.updateSupplier(orgId, 'supplier-1', dto);

      expect(eventBus.emit).toHaveBeenCalledTimes(1);
      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'SUPPLIER_UPDATED',
        source: 'suppliers-service',
        payload: {
          supplierId: 'supplier-1',
          changes: dto,
        },
      });
    });
  });

  // ──────────────────────────────────────────────
  // DELETE (soft delete)
  // ──────────────────────────────────────────────

  describe('deleteSupplier', () => {
    it('should soft delete a supplier by setting isActive to false', async () => {
      const supplier = {
        id: 'supplier-1',
        name: 'Distribuidora ABC',
        organizationId: orgId,
        isActive: true,
      };
      prisma.supplier.findFirst.mockResolvedValue(supplier);
      prisma.supplier.update.mockResolvedValue({ ...supplier, isActive: false });

      const result = await service.deleteSupplier(orgId, 'supplier-1');

      expect(prisma.supplier.update).toHaveBeenCalledWith({
        where: { id: 'supplier-1' },
        data: { isActive: false },
      });
      expect(result).toEqual({ message: 'Fornecedor desativado com sucesso' });
    });

    it('should throw NotFoundException when supplier does not exist', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);

      await expect(service.deleteSupplier(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(prisma.supplier.update).not.toHaveBeenCalled();
    });

    it('should emit SUPPLIER_DEACTIVATED event with reason', async () => {
      const supplier = {
        id: 'supplier-1',
        name: 'Distribuidora ABC',
        organizationId: orgId,
      };
      prisma.supplier.findFirst.mockResolvedValue(supplier);

      await service.deleteSupplier(orgId, 'supplier-1');

      expect(eventBus.emit).toHaveBeenCalledTimes(1);
      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'SUPPLIER_DEACTIVATED',
        source: 'suppliers-service',
        payload: {
          supplierId: 'supplier-1',
          name: 'Distribuidora ABC',
          reason: 'Exclusão via API (soft delete)',
        },
      });
    });

    it('should soft delete even when supplier is already inactive', async () => {
      const inactiveSupplier = {
        id: 'supplier-inactive',
        name: 'Already Inactive',
        organizationId: orgId,
        isActive: false,
      };
      prisma.supplier.findFirst.mockResolvedValue(inactiveSupplier);
      prisma.supplier.update.mockResolvedValue({ ...inactiveSupplier, isActive: false });

      await service.deleteSupplier(orgId, 'supplier-inactive');

      expect(prisma.supplier.update).toHaveBeenCalledWith({
        where: { id: 'supplier-inactive' },
        data: { isActive: false },
      });
    });
  });

  // ──────────────────────────────────────────────
  // TOGGLE ACTIVE
  // ──────────────────────────────────────────────

  describe('toggleActive', () => {
    it('should toggle from active to inactive', async () => {
      const activeSupplier = {
        id: 'supplier-1',
        name: 'Distribuidora ABC',
        organizationId: orgId,
        isActive: true,
      };
      prisma.supplier.findFirst.mockResolvedValue(activeSupplier);
      prisma.supplier.update.mockResolvedValue({ ...activeSupplier, isActive: false });

      const result = await service.toggleActive(orgId, 'supplier-1');

      expect(prisma.supplier.update).toHaveBeenCalledWith({
        where: { id: 'supplier-1' },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });

    it('should toggle from inactive to active', async () => {
      const inactiveSupplier = {
        id: 'supplier-1',
        name: 'Distribuidora ABC',
        organizationId: orgId,
        isActive: false,
      };
      prisma.supplier.findFirst.mockResolvedValue(inactiveSupplier);
      prisma.supplier.update.mockResolvedValue({ ...inactiveSupplier, isActive: true });

      const result = await service.toggleActive(orgId, 'supplier-1');

      expect(prisma.supplier.update).toHaveBeenCalledWith({
        where: { id: 'supplier-1' },
        data: { isActive: true },
      });
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException when supplier does not exist', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);

      await expect(service.toggleActive(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(prisma.supplier.update).not.toHaveBeenCalled();
    });

    it('should emit SUPPLIER_DEACTIVATED when deactivating', async () => {
      const activeSupplier = {
        id: 'supplier-1',
        name: 'Distribuidora ABC',
        organizationId: orgId,
        isActive: true,
      };
      prisma.supplier.findFirst.mockResolvedValue(activeSupplier);
      prisma.supplier.update.mockResolvedValue({ ...activeSupplier, isActive: false });

      await service.toggleActive(orgId, 'supplier-1');

      expect(eventBus.emit).toHaveBeenCalledTimes(1);
      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'SUPPLIER_DEACTIVATED',
        source: 'suppliers-service',
        payload: {
          supplierId: 'supplier-1',
          name: 'Distribuidora ABC',
        },
      });
    });

    it('should emit SUPPLIER_UPDATED when activating', async () => {
      const inactiveSupplier = {
        id: 'supplier-1',
        name: 'Distribuidora ABC',
        organizationId: orgId,
        isActive: false,
      };
      prisma.supplier.findFirst.mockResolvedValue(inactiveSupplier);
      prisma.supplier.update.mockResolvedValue({ ...inactiveSupplier, isActive: true });

      await service.toggleActive(orgId, 'supplier-1');

      expect(eventBus.emit).toHaveBeenCalledTimes(1);
      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'SUPPLIER_UPDATED',
        source: 'suppliers-service',
        payload: {
          supplierId: 'supplier-1',
          changes: { isActive: true },
        },
      });
    });

    it('should return id, name, and isActive in the response', async () => {
      const supplier = {
        id: 'supplier-1',
        name: 'Distribuidora ABC',
        organizationId: orgId,
        isActive: true,
      };
      prisma.supplier.findFirst.mockResolvedValue(supplier);
      prisma.supplier.update.mockResolvedValue({ ...supplier, isActive: false });

      const result = await service.toggleActive(orgId, 'supplier-1');

      expect(result).toEqual({ id: 'supplier-1', name: 'Distribuidora ABC', isActive: false });
    });
  });
});
