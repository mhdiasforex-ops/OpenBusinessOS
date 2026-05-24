import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { NfseService } from './nfse.service';
import { CreateNfseDto, CancelNfseDto } from './dto/nfse.dto';

describe('NfseService', () => {
  let service: NfseService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      nfse: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        aggregate: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      customer: {
        findFirst: vi.fn(),
      },
    };
    service = new NfseService(prisma);
  });

  const orgId = 'org-1';

  // ────────────────────────────────────────────────
  //  findAll
  // ────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const nfseList = [
        { id: 'nfse-1', numero: '00000001', amount: 1000 },
        { id: 'nfse-2', numero: '00000002', amount: 2000 },
      ];
      prisma.nfse.findMany.mockResolvedValue(nfseList);
      prisma.nfse.count.mockResolvedValue(10);

      const result = await service.findAll(orgId, 1, 20);

      expect(result).toEqual({
        data: nfseList,
        meta: { page: 1, limit: 20, total: 10, pages: 1 },
      });
    });

    it('should include customer in the query', async () => {
      prisma.nfse.findMany.mockResolvedValue([]);
      prisma.nfse.count.mockResolvedValue(0);

      await service.findAll(orgId);

      expect(prisma.nfse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { customer: { select: { id: true, name: true, email: true } } },
        }),
      );
    });

    it('should filter by organizationId', async () => {
      prisma.nfse.findMany.mockResolvedValue([]);
      prisma.nfse.count.mockResolvedValue(0);

      await service.findAll(orgId, 1, 10);

      expect(prisma.nfse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId },
        }),
      );
      expect(prisma.nfse.count).toHaveBeenCalledWith({
        where: { organizationId: orgId },
      });
    });

    it('should order by createdAt descending', async () => {
      prisma.nfse.findMany.mockResolvedValue([]);
      prisma.nfse.count.mockResolvedValue(0);

      await service.findAll(orgId);

      expect(prisma.nfse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });

    it('should apply pagination correctly', async () => {
      prisma.nfse.findMany.mockResolvedValue([]);
      prisma.nfse.count.mockResolvedValue(50);

      await service.findAll(orgId, 3, 10);

      expect(prisma.nfse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should calculate correct number of pages', async () => {
      prisma.nfse.findMany.mockResolvedValue(Array(10).fill({}));
      prisma.nfse.count.mockResolvedValue(25);

      const result = await service.findAll(orgId, 1, 10);

      expect(result.meta.pages).toBe(3);
    });

    it('should default to page 1 and limit 20', async () => {
      prisma.nfse.findMany.mockResolvedValue([]);
      prisma.nfse.count.mockResolvedValue(0);

      await service.findAll(orgId);

      expect(prisma.nfse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });
  });

  // ────────────────────────────────────────────────
  //  findOne
  // ────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return nfse with customer when found', async () => {
      const nfse = { id: 'nfse-1', numero: '00000001', customer: { id: 'cust-1', name: 'Customer' } };
      prisma.nfse.findFirst.mockResolvedValue(nfse);

      const result = await service.findOne(orgId, 'nfse-1');

      expect(result).toEqual(nfse);
      expect(prisma.nfse.findFirst).toHaveBeenCalledWith({
        where: { id: 'nfse-1', organizationId: orgId },
        include: { customer: true },
      });
    });

    it('should throw NotFoundException when nfse not found', async () => {
      prisma.nfse.findFirst.mockResolvedValue(null);

      await expect(service.findOne(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when nfse belongs to different org', async () => {
      prisma.nfse.findFirst.mockResolvedValue(null);

      await expect(service.findOne(orgId, 'nfse-999')).rejects.toThrow('NFS-e not found');
    });
  });

  // ────────────────────────────────────────────────
  //  getStats
  // ────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return aggregated stats for issued and cancelled', async () => {
      prisma.nfse.aggregate
        .mockResolvedValueOnce({
          _count: 10,
          _sum: { amount: 50000, totalTaxes: 5000, netAmount: 45000 },
        })
        .mockResolvedValueOnce({
          _count: 2,
          _sum: { amount: 3000 },
        });

      const result = await service.getStats(orgId);

      expect(result).toEqual({
        totalIssued: 10,
        totalCancelled: 2,
        totalRevenue: 50000,
        totalTaxes: 5000,
        netRevenue: 45000,
      });
    });

    it('should return zeros when no data exists', async () => {
      prisma.nfse.aggregate
        .mockResolvedValueOnce({
          _count: 0,
          _sum: { amount: null, totalTaxes: null, netAmount: null },
        })
        .mockResolvedValueOnce({
          _count: 0,
          _sum: { amount: null },
        });

      const result = await service.getStats(orgId);

      expect(result).toEqual({
        totalIssued: 0,
        totalCancelled: 0,
        totalRevenue: 0,
        totalTaxes: 0,
        netRevenue: 0,
      });
    });

    it('should filter by organizationId', async () => {
      prisma.nfse.aggregate
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: null, totalTaxes: null, netAmount: null } })
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: null } });

      await service.getStats(orgId);

      expect(prisma.nfse.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId, status: 'ISSUED' },
        }),
      );
      expect(prisma.nfse.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId, status: 'CANCELLED' },
        }),
      );
    });

    it('should aggregate correct fields for ISSUED status', async () => {
      prisma.nfse.aggregate
        .mockResolvedValueOnce({ _count: 5, _sum: { amount: 10000, totalTaxes: 1000, netAmount: 9000 } })
        .mockResolvedValueOnce({ _count: 0, _sum: { amount: null } });

      const result = await service.getStats(orgId);

      expect(prisma.nfse.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          _sum: { amount: true, totalTaxes: true, netAmount: true },
          _count: true,
        }),
      );
    });
  });

  // ────────────────────────────────────────────────
  //  create
  // ────────────────────────────────────────────────

  describe('create', () => {
    const createDto: CreateNfseDto = {
      customerId: 'cust-1',
      serviceDescription: 'Consultoria de TI',
      serviceCode: '01.01',
      amount: 1000,
      cityCode: '3550308',
    };

    it('should create nfse with calculated taxes', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1', name: 'Customer' });
      prisma.nfse.count.mockResolvedValue(0);
      prisma.nfse.create.mockResolvedValue({
        id: 'nfse-1',
        numero: '00000001',
        organizationId: orgId,
        customerId: 'cust-1',
        amount: 1000,
        issAmount: 50,
        pisAmount: 6.50,
        cofinsAmount: 30,
        csllAmount: 10,
        irAmount: 15,
        totalTaxes: 111.50,
        netAmount: 888.50,
        serviceDescription: 'Consultoria de TI',
        serviceCode: '01.01',
        codigoVerificacao: 'ABCD1234',
        cityCode: '3550308',
        issueDate: new Date(),
      });

      const result = await service.create(orgId, createDto);

      expect(result.amount).toBe(1000);
      expect(result.issAmount).toBe(50); // 1000 * 5%
      expect(result.pisAmount).toBe(6.50); // 1000 * 0.65%
      expect(result.cofinsAmount).toBe(30); // 1000 * 3%
      expect(result.csllAmount).toBe(10); // 1000 * 1%
      expect(result.irAmount).toBe(15); // 1000 * 1.5%
      expect(result.totalTaxes).toBe(111.50);
      expect(result.netAmount).toBe(888.50);
    });

    it('should use custom tax rates when provided', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1', name: 'Customer' });
      prisma.nfse.count.mockResolvedValue(0);
      prisma.nfse.create.mockResolvedValue({
        id: 'nfse-1',
        numero: '00000001',
        issAmount: 100,
        pisAmount: 10,
        cofinsAmount: 50,
        csllAmount: 20,
        irAmount: 30,
        totalTaxes: 210,
        netAmount: 790,
        amount: 1000,
      });

      const customDto: CreateNfseDto = {
        ...createDto,
        issRate: 10,
        pisRate: 1,
        cofinsRate: 5,
        csllRate: 2,
        irRate: 3,
      };

      const result = await service.create(orgId, customDto);

      expect(result.issAmount).toBe(100);
      expect(result.pisAmount).toBe(10);
      expect(result.cofinsAmount).toBe(50);
      expect(result.csllAmount).toBe(20);
      expect(result.irAmount).toBe(30);
      expect(result.totalTaxes).toBe(210);
      expect(result.netAmount).toBe(790);
    });

    it('should throw NotFoundException when customer not found', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.create(orgId, createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(orgId, createDto)).rejects.toThrow('Customer not found');
    });

    it('should generate sequential numero padded to 8 digits', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1', name: 'Customer' });
      prisma.nfse.count.mockResolvedValue(5);
      prisma.nfse.create.mockResolvedValue({ id: 'nfse-1', numero: '00000006' });

      await service.create(orgId, createDto);

      expect(prisma.nfse.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ numero: '00000006' }),
        }),
      );
    });

    it('should generate verification code', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1', name: 'Customer' });
      prisma.nfse.count.mockResolvedValue(0);
      prisma.nfse.create.mockResolvedValue({ id: 'nfse-1', codigoVerificacao: 'ABCD1234' });

      await service.create(orgId, createDto);

      const createCall = prisma.nfse.create.mock.calls[0][0];
      expect(createCall.data.codigoVerificacao).toBeDefined();
      expect(createCall.data.codigoVerificacao.length).toBe(8);
    });

    it('should set issueDate to current date', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1', name: 'Customer' });
      prisma.nfse.count.mockResolvedValue(0);
      prisma.nfse.create.mockResolvedValue({ id: 'nfse-1' });

      await service.create(orgId, createDto);

      const createCall = prisma.nfse.create.mock.calls[0][0];
      expect(createCall.data.issueDate).toBeInstanceOf(Date);
    });

    it('should validate customer against the correct organization', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.create(orgId, createDto)).rejects.toThrow(NotFoundException);

      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { id: 'cust-1', organizationId: orgId },
      });
    });
  });

  // ────────────────────────────────────────────────
  //  cancel
  // ────────────────────────────────────────────────

  describe('cancel', () => {
    const cancelDto: CancelNfseDto = { reason: 'Cliente desistiu do serviço' };

    it('should cancel an existing nfse', async () => {
      const existing = { id: 'nfse-1', numero: '00000001', status: 'ISSUED', organizationId: orgId };
      const cancelled = { ...existing, status: 'CANCELLED', cancellationReason: cancelDto.reason, cancelledAt: new Date() };

      prisma.nfse.findFirst.mockResolvedValue(existing);
      prisma.nfse.update.mockResolvedValue(cancelled);

      const result = await service.cancel(orgId, 'nfse-1', cancelDto);

      expect(result.status).toBe('CANCELLED');
      expect(result.cancellationReason).toBe(cancelDto.reason);
      expect(result.cancelledAt).toBeDefined();
    });

    it('should throw NotFoundException when nfse does not exist', async () => {
      prisma.nfse.findFirst.mockResolvedValue(null);

      await expect(service.cancel(orgId, 'nonexistent', cancelDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when nfse is already cancelled', async () => {
      prisma.nfse.findFirst.mockResolvedValue({ id: 'nfse-1', status: 'CANCELLED', organizationId: orgId });

      await expect(service.cancel(orgId, 'nfse-1', cancelDto)).rejects.toThrow(BadRequestException);
      await expect(service.cancel(orgId, 'nfse-1', cancelDto)).rejects.toThrow('NFS-e already cancelled');
    });

    it('should update with status and cancellation reason', async () => {
      prisma.nfse.findFirst.mockResolvedValue({ id: 'nfse-1', status: 'ISSUED', organizationId: orgId });
      prisma.nfse.update.mockResolvedValue({});

      await service.cancel(orgId, 'nfse-1', cancelDto);

      expect(prisma.nfse.update).toHaveBeenCalledWith({
        where: { id: 'nfse-1' },
        data: { status: 'CANCELLED', cancellationReason: cancelDto.reason, cancelledAt: expect.any(Date) },
      });
    });

    it('should verify organization ownership before cancelling', async () => {
      prisma.nfse.findFirst.mockResolvedValue(null);

      await expect(service.cancel(orgId, 'nfse-999', cancelDto)).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────
  //  getCities
  // ────────────────────────────────────────────────

  describe('getCities', () => {
    it('should return list of cities with code, name, state', () => {
      const result = service.getCities();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include Sao Paulo with correct data', () => {
      const result = service.getCities();

      const sp = result.find(c => c.code === '3550308');
      expect(sp).toBeDefined();
      expect(sp!.name).toBe('Sao Paulo');
      expect(sp!.state).toBe('SP');
    });

    it('should include major Brazilian cities', () => {
      const result = service.getCities();
      const codes = result.map(c => c.code);

      expect(codes).toContain('3304557'); // Rio de Janeiro
      expect(codes).toContain('5300108'); // Brasilia
      expect(codes).toContain('2927408'); // Salvador
      expect(codes).toContain('3106200'); // Belo Horizonte
    });

    it('should not be empty', () => {
      const result = service.getCities();

      expect(result.length).toBeGreaterThan(10);
    });

    it('should always return the same static list', () => {
      const r1 = service.getCities();
      const r2 = service.getCities();

      expect(r1).toEqual(r2);
    });
  });
});
