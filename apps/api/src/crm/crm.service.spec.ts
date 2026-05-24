import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmService } from './crm.service';
import { PrismaService } from '../prisma/prisma.service';
import { LtvService } from './ltv.service';
import { SegmentationService } from './segmentation.service';
import { ChurnDetectorService } from './churn-detector.service';
import { CreateCustomerDto, UpdateCustomerDto, CreateCampaignDto } from './crm.dto';

describe('CrmService', () => {
  let service: CrmService;
  let prisma: any;
  let eventBus: any;
  let ltvService: any;
  let segmentationService: any;
  let churnDetectorService: any;

  beforeEach(() => {
    prisma = {
      customer: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      campaign: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
    };
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) };
    ltvService = { calculateLTV: vi.fn().mockResolvedValue(1000) };
    segmentationService = {
      segmentCustomers: vi.fn().mockResolvedValue({
        segments: { VIP: 5, REGULAR: 10 },
        totalCustomers: 15,
        churnRiskCount: 2,
        churnRiskCustomerIds: ['cust-3', 'cust-7'],
      }),
    };
    churnDetectorService = { detectAndEmitChurnRisk: vi.fn().mockResolvedValue(undefined) };

    service = new CrmService(prisma, eventBus, ltvService, segmentationService, churnDetectorService);
  });

  const orgId = 'org-123';

  describe('createCustomer', () => {
    const dto: CreateCustomerDto = {
      name: 'Maria Santos',
      email: 'maria@email.com',
      phone: '(11) 99999-0000',
    };

    it('should create a customer and emit event', async () => {
      prisma.customer.create.mockResolvedValue({ id: 'cust-1', ...dto, organizationId: orgId, segment: 'NEW' });

      const result = await service.createCustomer(orgId, dto);

      expect(prisma.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: 'Maria Santos', email: 'maria@email.com' }) })
      );
      expect(eventBus.emit).toHaveBeenCalled();
    });
  });

  describe('getCustomers', () => {
    it('should return paginated customers', async () => {
      prisma.customer.findMany.mockResolvedValue([{ id: 'cust-1' }, { id: 'cust-2' }]);
      prisma.customer.count.mockResolvedValue(25);

      const result = await service.getCustomers(orgId, { page: 1, perPage: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
    });

    it('should filter by segment', async () => {
      prisma.customer.findMany.mockResolvedValue([]);
      prisma.customer.count.mockResolvedValue(0);

      await service.getCustomers(orgId, { segment: 'VIP' });

      const findManyCall = prisma.customer.findMany.mock.calls[0][0];
      expect(findManyCall.where.segment).toBe('VIP');
    });

    it('should search by name/email/document', async () => {
      prisma.customer.findMany.mockResolvedValue([]);
      prisma.customer.count.mockResolvedValue(0);

      await service.getCustomers(orgId, { search: 'maria' });

      const findManyCall = prisma.customer.findMany.mock.calls[0][0];
      expect(findManyCall.where.OR).toBeDefined();
      expect(findManyCall.where.OR).toHaveLength(3);
    });
  });

  describe('updateCustomer', () => {
    it('should update customer and return result', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1', organizationId: orgId });
      prisma.customer.update.mockResolvedValue({ id: 'cust-1', name: 'Maria Updated' });

      const result = await service.updateCustomer(orgId, 'cust-1', { name: 'Maria Updated' } as UpdateCustomerDto);

      expect(prisma.customer.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent customer', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.updateCustomer(orgId, 'cust-999', { name: 'X' } as UpdateCustomerDto)).rejects.toThrow();
    });
  });

  describe('deleteCustomer', () => {
    it('should delete existing customer', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1' });
      prisma.customer.delete.mockResolvedValue({ id: 'cust-1' });

      await service.deleteCustomer(orgId, 'cust-1');
      expect(prisma.customer.delete).toHaveBeenCalledWith({ where: { id: 'cust-1' } });
    });

    it('should throw NotFoundException for non-existent customer', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      await expect(service.deleteCustomer(orgId, 'cust-999')).rejects.toThrow();
    });
  });

  describe('getCustomer', () => {
    it('should return customer with transactions', async () => {
      prisma.customer.findFirst.mockResolvedValue({
        id: 'cust-1',
        name: 'Maria Santos',
        email: 'maria@email.com',
        transactions: [{ id: 'tx-1', amount: 100, status: 'PAID' }],
      });

      const result = await service.getCustomer(orgId, 'cust-1');
      expect(result.name).toBe('Maria Santos');
      expect(result.transactions).toHaveLength(1);
      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { id: 'cust-1', organizationId: orgId },
        include: {
          transactions: {
            where: { type: 'INCOME', status: 'PAID' },
            orderBy: { paidAt: 'desc' },
            take: 20,
          },
        },
      });
    });

    it('should throw NotFoundException when customer not found', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);
      await expect(service.getCustomer(orgId, 'cust-999')).rejects.toThrow('Cliente não encontrado');
    });
  });

  describe('calculateLTV', () => {
    it('should delegate to LtvService', async () => {
      const result = await service.calculateLTV(orgId, 'cust-1');
      expect(ltvService.calculateLTV).toHaveBeenCalledWith(orgId, 'cust-1');
      expect(result).toBe(1000);
    });
  });

  describe('segmentCustomers', () => {
    it('should segment customers and detect churn risk', async () => {
      const result = await service.segmentCustomers(orgId);
      expect(segmentationService.segmentCustomers).toHaveBeenCalledWith(orgId);
      expect(churnDetectorService.detectAndEmitChurnRisk).toHaveBeenCalledWith(orgId, ['cust-3', 'cust-7']);
      expect(result.segments).toEqual({ VIP: 5, REGULAR: 10 });
      expect(result.totalCustomers).toBe(15);
      expect(result.churnRiskCount).toBe(2);
    });

    it('should not detect churn risk when there are no at-risk customers', async () => {
      segmentationService.segmentCustomers.mockResolvedValue({
        segments: { VIP: 3 },
        totalCustomers: 3,
        churnRiskCount: 0,
        churnRiskCustomerIds: [],
      });

      await service.segmentCustomers(orgId);
      expect(churnDetectorService.detectAndEmitChurnRisk).not.toHaveBeenCalled();
    });
  });

  describe('createCampaign', () => {
    it('should create campaign and emit event', async () => {
      const dto: CreateCampaignDto = {
        name: 'Black Friday',
        channel: 'EMAIL',
        segment: 'ALL',
        recipientCount: 500,
        message: '50% off!',
      };

      const result = await service.createCampaign(orgId, dto);
      expect(result.name).toBe('Black Friday');
      expect(result.status).toBe('SENT');
      expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: orgId,
        type: 'CAMPAIGN_SENT',
        source: 'crm-service',
      }));
    });
  });
});
