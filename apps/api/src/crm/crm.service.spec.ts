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
    ltvService = { calculateLtv: vi.fn().mockResolvedValue(1000) };
    segmentationService = { autoSegment: vi.fn().mockResolvedValue(undefined) };
    churnDetectorService = { analyzeChurnRisk: vi.fn().mockResolvedValue({ risk: 'low' }) };

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
  });
});
