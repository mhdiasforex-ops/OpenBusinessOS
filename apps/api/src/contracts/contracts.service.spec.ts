import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto, UpdateContractDto } from './contracts.dto';

describe('ContractsService', () => {
  let service: ContractsService;
  let prisma: any;

  const orgId = 'org-123';

  beforeEach(() => {
    prisma = {
      contract: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        groupBy: vi.fn(),
        aggregate: vi.fn(),
      },
    };
    service = new ContractsService(prisma);
  });

  // ──────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────

  describe('createContract', () => {
    it('should create a contract with all fields', async () => {
      const dto: CreateContractDto = {
        title: 'Contrato de Prestação de Serviços',
        description: 'Consultoria mensal',
        type: 'SERVICE',
        supplierId: 'supplier-1',
        customerId: 'customer-1',
        value: 15000,
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-12-31T23:59:59Z',
        metadata: { numeroContrato: 'CT-2026-001' },
      };

      const createdContract = {
        id: 'contract-1',
        organizationId: orgId,
        ...dto,
        status: 'DRAFT',
        startDate: new Date('2026-01-01T00:00:00Z'),
        endDate: new Date('2026-12-31T23:59:59Z'),
        supplier: { id: 'supplier-1', name: 'Distribuidora ABC' },
        customer: { id: 'customer-1', name: 'Cliente XYZ' },
      };
      prisma.contract.create.mockResolvedValue(createdContract);

      const result = await service.createContract(orgId, dto);

      expect(prisma.contract.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          title: dto.title,
          description: dto.description,
          type: 'SERVICE',
          status: 'DRAFT',
          supplierId: dto.supplierId,
          customerId: dto.customerId,
          value: 15000,
          startDate: new Date('2026-01-01T00:00:00Z'),
          endDate: new Date('2026-12-31T23:59:59Z'),
          metadata: { numeroContrato: 'CT-2026-001' },
        },
        include: {
          supplier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
        },
      });
      expect(result).toEqual(createdContract);
    });

    it('should create a contract with minimal fields', async () => {
      const dto: CreateContractDto = { title: 'Minimal Contract' };

      const createdContract = {
        id: 'contract-2',
        organizationId: orgId,
        title: 'Minimal Contract',
        description: undefined,
        type: 'OTHER',
        status: 'DRAFT',
        supplierId: undefined,
        customerId: undefined,
        value: 0,
        startDate: undefined,
        endDate: undefined,
        metadata: {},
        supplier: null,
        customer: null,
      };
      prisma.contract.create.mockResolvedValue(createdContract);

      const result = await service.createContract(orgId, dto);

      expect(prisma.contract.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          title: 'Minimal Contract',
          description: undefined,
          type: 'OTHER',
          status: 'DRAFT',
          supplierId: undefined,
          customerId: undefined,
          value: 0,
          startDate: undefined,
          endDate: undefined,
          metadata: {},
        },
        include: {
          supplier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
        },
      });
      expect(result.type).toBe('OTHER');
      expect(result.value).toBe(0);
    });

    it('should default type to OTHER when not provided', async () => {
      const dto: CreateContractDto = { title: 'Contract' };
      prisma.contract.create.mockResolvedValue({ id: 'c-1', type: 'OTHER' });

      await service.createContract(orgId, dto);

      expect(prisma.contract.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'OTHER' }),
        }),
      );
    });

    it('should default value to 0 when not provided', async () => {
      const dto: CreateContractDto = { title: 'Contract' };
      prisma.contract.create.mockResolvedValue({ id: 'c-1', value: 0 });

      await service.createContract(orgId, dto);

      expect(prisma.contract.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ value: 0 }),
        }),
      );
    });

    it('should default metadata to empty object when not provided', async () => {
      const dto: CreateContractDto = { title: 'Contract' };
      prisma.contract.create.mockResolvedValue({ id: 'c-1', metadata: {} });

      await service.createContract(orgId, dto);

      expect(prisma.contract.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ metadata: {} }),
        }),
      );
    });

    it('should always set status to DRAFT on creation', async () => {
      const dto: CreateContractDto = { title: 'Contract', type: 'SERVICE' };
      prisma.contract.create.mockResolvedValue({ id: 'c-1', status: 'DRAFT' });

      await service.createContract(orgId, dto);

      expect(prisma.contract.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'DRAFT' }),
        }),
      );
    });

    it('should parse date strings to Date objects', async () => {
      const dto: CreateContractDto = {
        title: 'Contract',
        startDate: '2026-06-01T00:00:00Z',
        endDate: '2026-08-31T23:59:59Z',
      };
      prisma.contract.create.mockResolvedValue({ id: 'c-1' });

      await service.createContract(orgId, dto);

      expect(prisma.contract.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startDate: new Date('2026-06-01T00:00:00Z'),
            endDate: new Date('2026-08-31T23:59:59Z'),
          }),
        }),
      );
    });

    it('should include supplier and customer in response', async () => {
      const dto: CreateContractDto = {
        title: 'Contract',
        supplierId: 'supplier-1',
        customerId: 'customer-1',
      };
      prisma.contract.create.mockResolvedValue({
        id: 'c-1',
        supplier: { id: 'supplier-1', name: 'Distribuidora ABC' },
        customer: { id: 'customer-1', name: 'Cliente XYZ' },
      });

      const result = await service.createContract(orgId, dto);

      expect(result.supplier).toEqual({ id: 'supplier-1', name: 'Distribuidora ABC' });
      expect(result.customer).toEqual({ id: 'customer-1', name: 'Cliente XYZ' });
    });
  });

  // ──────────────────────────────────────────────
  // LIST (getContracts)
  // ──────────────────────────────────────────────

  describe('getContracts', () => {
    it('should return paginated contracts with default pagination', async () => {
      const contracts = [
        { id: 'c-1', title: 'Contract 1', supplier: null, customer: null },
      ];
      prisma.contract.findMany.mockResolvedValue(contracts);
      prisma.contract.count.mockResolvedValue(10);

      const result = await service.getContracts(orgId, {});

      expect(prisma.contract.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 25,
        include: {
          supplier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
        },
      });
      expect(prisma.contract.count).toHaveBeenCalledWith({ where: { organizationId: orgId } });
      expect(result.data).toEqual(contracts);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(25);
    });

    it('should apply custom pagination', async () => {
      prisma.contract.findMany.mockResolvedValue([]);
      prisma.contract.count.mockResolvedValue(50);

      const result = await service.getContracts(orgId, { page: 3, perPage: 10 });

      expect(prisma.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.page).toBe(3);
      expect(result.perPage).toBe(10);
      expect(result.totalPages).toBe(5);
    });

    it('should filter by status', async () => {
      prisma.contract.findMany.mockResolvedValue([]);
      prisma.contract.count.mockResolvedValue(0);

      await service.getContracts(orgId, { status: 'ACTIVE' });

      expect(prisma.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('should filter by type', async () => {
      prisma.contract.findMany.mockResolvedValue([]);
      prisma.contract.count.mockResolvedValue(0);

      await service.getContracts(orgId, { type: 'SERVICE' });

      expect(prisma.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'SERVICE' }),
        }),
      );
    });

    it('should search by title using insensitive contains', async () => {
      prisma.contract.findMany.mockResolvedValue([]);
      prisma.contract.count.mockResolvedValue(0);

      await service.getContracts(orgId, { search: 'Consultoria' });

      const callWhere = prisma.contract.findMany.mock.calls[0][0].where;
      expect(callWhere.OR).toEqual(
        expect.arrayContaining([
          { title: { contains: 'Consultoria', mode: 'insensitive' } },
        ]),
      );
    });

    it('should search by description using insensitive contains', async () => {
      prisma.contract.findMany.mockResolvedValue([]);
      prisma.contract.count.mockResolvedValue(0);

      await service.getContracts(orgId, { search: 'mensal' });

      const callWhere = prisma.contract.findMany.mock.calls[0][0].where;
      expect(callWhere.OR).toEqual(
        expect.arrayContaining([
          { description: { contains: 'mensal', mode: 'insensitive' } },
        ]),
      );
    });

    it('should combine status, type, and search filters', async () => {
      prisma.contract.findMany.mockResolvedValue([]);
      prisma.contract.count.mockResolvedValue(0);

      await service.getContracts(orgId, {
        status: 'ACTIVE',
        type: 'SERVICE',
        search: 'Consultoria',
      });

      const callWhere = prisma.contract.findMany.mock.calls[0][0].where;
      expect(callWhere.status).toBe('ACTIVE');
      expect(callWhere.type).toBe('SERVICE');
      expect(callWhere.OR).toBeDefined();
    });

    it('should compute totalPages correctly', async () => {
      prisma.contract.findMany.mockResolvedValue([]);
      prisma.contract.count.mockResolvedValue(7);

      const result = await service.getContracts(orgId, { perPage: 5 });

      expect(result.totalPages).toBe(2);
    });
  });

  // ──────────────────────────────────────────────
  // GET ONE (getContract)
  // ──────────────────────────────────────────────

  describe('getContract', () => {
    it('should return a contract with full supplier and customer details', async () => {
      const mockContract = {
        id: 'contract-1',
        title: 'Contrato de Prestação de Serviços',
        supplier: { id: 'supplier-1', name: 'Distribuidora ABC', email: 'contato@abc.com', phone: '(11) 3333-4444' },
        customer: { id: 'customer-1', name: 'Cliente XYZ', email: 'cliente@xyz.com', phone: '(21) 9999-8888' },
      };
      prisma.contract.findFirst.mockResolvedValue(mockContract);

      const result = await service.getContract(orgId, 'contract-1');

      expect(prisma.contract.findFirst).toHaveBeenCalledWith({
        where: { id: 'contract-1', organizationId: orgId },
        include: {
          supplier: { select: { id: true, name: true, email: true, phone: true } },
          customer: { select: { id: true, name: true, email: true, phone: true } },
        },
      });
      expect(result).toEqual(mockContract);
    });

    it('should throw NotFoundException when contract does not exist', async () => {
      prisma.contract.findFirst.mockResolvedValue(null);

      await expect(service.getContract(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.getContract(orgId, 'nonexistent')).rejects.toThrow(
        'Contrato não encontrado',
      );
    });

    it('should return contract with null supplier and customer when not linked', async () => {
      prisma.contract.findFirst.mockResolvedValue({
        id: 'contract-1',
        title: 'Contract',
        supplier: null,
        customer: null,
      });

      const result = await service.getContract(orgId, 'contract-1');

      expect(result.supplier).toBeNull();
      expect(result.customer).toBeNull();
    });
  });

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────

  describe('updateContract', () => {
    it('should update a contract partially', async () => {
      const existingContract = {
        id: 'contract-1',
        organizationId: orgId,
        title: 'Original Title',
        status: 'DRAFT',
      };
      const updatedContract = {
        ...existingContract,
        title: 'Updated Title',
        status: 'ACTIVE',
        supplier: { id: 'supplier-1', name: 'Distribuidora ABC' },
        customer: { id: 'customer-1', name: 'Cliente XYZ' },
      };
      prisma.contract.findFirst.mockResolvedValue(existingContract);
      prisma.contract.update.mockResolvedValue(updatedContract);

      const dto: UpdateContractDto = { title: 'Updated Title', status: 'ACTIVE' };
      const result = await service.updateContract(orgId, 'contract-1', dto);

      expect(prisma.contract.update).toHaveBeenCalledWith({
        where: { id: 'contract-1' },
        data: {
          title: 'Updated Title',
          description: undefined,
          type: undefined,
          status: 'ACTIVE',
          supplierId: undefined,
          customerId: undefined,
          value: undefined,
          startDate: undefined,
          endDate: undefined,
          metadata: undefined,
        },
        include: {
          supplier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
        },
      });
      expect(result).toEqual(updatedContract);
    });

    it('should throw NotFoundException when contract does not exist', async () => {
      prisma.contract.findFirst.mockResolvedValue(null);

      await expect(
        service.updateContract(orgId, 'nonexistent', {} as UpdateContractDto),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.contract.update).not.toHaveBeenCalled();
    });

    it('should parse date strings when updating dates', async () => {
      const existing = { id: 'c-1', organizationId: orgId };
      prisma.contract.findFirst.mockResolvedValue(existing);
      prisma.contract.update.mockResolvedValue({ id: 'c-1' });

      await service.updateContract(orgId, 'c-1', {
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-09-30T23:59:59Z',
      } as UpdateContractDto);

      expect(prisma.contract.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startDate: new Date('2026-07-01T00:00:00Z'),
            endDate: new Date('2026-09-30T23:59:59Z'),
          }),
        }),
      );
    });

    it('should cast type and status to enums when provided', async () => {
      const existing = { id: 'c-1', organizationId: orgId };
      prisma.contract.findFirst.mockResolvedValue(existing);
      prisma.contract.update.mockResolvedValue({ id: 'c-1' });

      await service.updateContract(orgId, 'c-1', {
        type: 'SUPPLY',
        status: 'ACTIVE',
      } as UpdateContractDto);

      expect(prisma.contract.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'SUPPLY',
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('should update supplierId, customerId, value, and metadata', async () => {
      const existing = { id: 'c-1', organizationId: orgId };
      prisma.contract.findFirst.mockResolvedValue(existing);
      prisma.contract.update.mockResolvedValue({ id: 'c-1' });

      await service.updateContract(orgId, 'c-1', {
        supplierId: 'supplier-2',
        customerId: 'customer-2',
        value: 25000,
        metadata: { key: 'value' },
      } as UpdateContractDto);

      expect(prisma.contract.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            supplierId: 'supplier-2',
            customerId: 'customer-2',
            value: 25000,
            metadata: { key: 'value' },
          }),
        }),
      );
    });

    it('should include supplier and customer in response', async () => {
      const existing = { id: 'c-1', organizationId: orgId };
      prisma.contract.findFirst.mockResolvedValue(existing);
      prisma.contract.update.mockResolvedValue({
        id: 'c-1',
        supplier: { id: 'supplier-1', name: 'Distribuidora ABC' },
        customer: { id: 'customer-1', name: 'Cliente XYZ' },
      });

      const result = await service.updateContract(orgId, 'c-1', { title: 'Updated' } as UpdateContractDto);

      expect(result.supplier).toEqual({ id: 'supplier-1', name: 'Distribuidora ABC' });
      expect(result.customer).toEqual({ id: 'customer-1', name: 'Cliente XYZ' });
    });
  });

  // ──────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────

  describe('deleteContract', () => {
    it('should delete a contract and return success message', async () => {
      const existingContract = {
        id: 'contract-1',
        organizationId: orgId,
        title: 'Contract to Delete',
      };
      prisma.contract.findFirst.mockResolvedValue(existingContract);

      const result = await service.deleteContract(orgId, 'contract-1');

      expect(prisma.contract.findFirst).toHaveBeenCalledWith({
        where: { id: 'contract-1', organizationId: orgId },
      });
      expect(prisma.contract.delete).toHaveBeenCalledWith({
        where: { id: 'contract-1' },
      });
      expect(result).toEqual({ message: 'Contrato removido' });
    });

    it('should throw NotFoundException when contract does not exist', async () => {
      prisma.contract.findFirst.mockResolvedValue(null);

      await expect(service.deleteContract(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.deleteContract(orgId, 'nonexistent')).rejects.toThrow(
        'Contrato não encontrado',
      );
      expect(prisma.contract.delete).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // STATS (getStats)
  // ──────────────────────────────────────────────

  describe('getStats', () => {
    it('should return comprehensive contract statistics', async () => {
      const now = new Date();
      prisma.contract.count.mockResolvedValue(50);
      prisma.contract.groupBy
        .mockResolvedValueOnce([
          { status: 'DRAFT', _count: { status: 10 } },
          { status: 'ACTIVE', _count: { status: 25 } },
          { status: 'EXPIRED', _count: { status: 10 } },
          { status: 'TERMINATED', _count: { status: 5 } },
        ])
        .mockResolvedValueOnce([
          { type: 'SERVICE', _count: { type: 20 } },
          { type: 'SUPPLY', _count: { type: 15 } },
          { type: 'RENT', _count: { type: 5 } },
          { type: 'OTHER', _count: { type: 10 } },
        ]);
      prisma.contract.aggregate.mockResolvedValue({
        _sum: { value: 500000 },
      });

      const expiringSoonCount = 3;
      // The getStats method computes thirtyDaysFromNow internally;
      // we need to allow the count call for expiringSoon to return our value.
      // Since count is called twice (once for total, once for expiringSoon),
      // we need to set up the mock accordingly.
      prisma.contract.count
        .mockResolvedValueOnce(50)   // total
        .mockResolvedValueOnce(expiringSoonCount); // expiringSoon

      const result = await service.getStats(orgId);

      // total
      expect(prisma.contract.count).toHaveBeenCalledWith({
        where: { organizationId: orgId },
      });

      // byStatus — groupBy by status
      expect(prisma.contract.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { status: true },
      });

      // byType — groupBy by type
      expect(prisma.contract.groupBy).toHaveBeenCalledWith({
        by: ['type'],
        where: { organizationId: orgId },
        _count: { type: true },
      });

      // totalValue
      expect(prisma.contract.aggregate).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        _sum: { value: true },
      });

      // expiringSoon — count with date range
      const countCallForExpiring = prisma.contract.count.mock.calls[1];
      expect(countCallForExpiring[0].where.organizationId).toBe(orgId);
      expect(countCallForExpiring[0].where.status).toBe('ACTIVE');
      expect(countCallForExpiring[0].where.endDate).toBeDefined();
      expect(countCallForExpiring[0].where.endDate.lte).toBeInstanceOf(Date);
      expect(countCallForExpiring[0].where.endDate.gte).toBeInstanceOf(Date);

      // result
      expect(result).toEqual({
        total: 50,
        totalValue: 500000,
        expiringSoon: 3,
        byStatus: { DRAFT: 10, ACTIVE: 25, EXPIRED: 10, TERMINATED: 5 },
        byType: { SERVICE: 20, SUPPLY: 15, RENT: 5, OTHER: 10 },
      });
    });

    it('should default totalValue to 0 when aggregate returns null', async () => {
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.groupBy.mockResolvedValue([]).mockResolvedValue([]);
      prisma.contract.aggregate.mockResolvedValue({ _sum: { value: null } });

      const result = await service.getStats(orgId);

      expect(result.totalValue).toBe(0);
    });

    it('should return empty objects for byStatus and byType when no contracts exist', async () => {
      prisma.contract.count.mockResolvedValue(0);
      prisma.contract.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      prisma.contract.aggregate.mockResolvedValue({ _sum: { value: null } });

      const result = await service.getStats(orgId);

      expect(result.byStatus).toEqual({});
      expect(result.byType).toEqual({});
    });

    it('should set expiringSoon based on ACTIVE contracts ending within 30 days', async () => {
      prisma.contract.count.mockResolvedValue(10);
      prisma.contract.groupBy.mockResolvedValue([]).mockResolvedValue([]);
      prisma.contract.aggregate.mockResolvedValue({ _sum: { value: 0 } });

      const result = await service.getStats(orgId);

      const expiringCall = prisma.contract.count.mock.calls[1][0];
      expect(expiringCall.where.status).toBe('ACTIVE');
      expect(expiringCall.where.endDate.lte).toBeInstanceOf(Date);
      expect(expiringCall.where.endDate.gte).toBeInstanceOf(Date);

      // Verify the range is ~30 days
      const now = Date.now();
      const diff = expiringCall.where.endDate.lte.getTime() - now;
      // Allow some slack for test execution
      expect(diff).toBeGreaterThan(29 * 24 * 60 * 60 * 1000);
      expect(diff).toBeLessThan(31 * 24 * 60 * 60 * 1000);
    });
  });
});
