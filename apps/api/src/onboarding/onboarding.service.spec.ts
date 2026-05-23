import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { ConfigGeneratorService } from './config-generator.service';
import { NotFoundException } from '@nestjs/common';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: any;
  let eventBus: any;
  let configGenerator: any;

  beforeEach(() => {
    prisma = {
      organization: {
        update: vi.fn().mockResolvedValue({ id: 'org-1', niche: 'RETAIL' }),
        findUnique: vi.fn().mockResolvedValue({ id: 'org-1', settings: {} }),
      },
      product: { create: vi.fn().mockResolvedValue({ id: 'prod-1' }) },
      workflow: { create: vi.fn().mockResolvedValue({ id: 'wf-1' }) },
    } as any;
    eventBus = { emit: vi.fn() } as any;
    configGenerator = {
      getConfig: vi.fn().mockReturnValue({
        name: 'Varejo',
        categories: ['Vendas', 'Custos'],
        defaultProducts: [{ name: 'Produto A', category: 'Vendas', salePrice: 100 }],
        defaultWorkflows: [{ name: 'Notificação', trigger: 'ORDER_CREATED' }],
        tips: ['Organize seu estoque'],
      }),
    } as any;
    service = new OnboardingService(prisma, eventBus, configGenerator);
  });

  describe('getConfig', () => {
    it('should return config for given niche', async () => {
      const result = await service.getConfig('RETAIL');
      expect(result.name).toBe('Varejo');
      expect(result.categories).toBeDefined();
    });
  });

  describe('startOnboarding', () => {
    it('should update organization niche and return onboarding steps', async () => {
      const result = await service.startOnboarding('org-1', 'RETAIL');
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { niche: 'RETAIL' },
      });
      expect(result.niche).toBe('Varejo');
      expect(result.steps).toHaveLength(4);
      expect(result.steps[0].id).toBe('categories');
    });
  });

  describe('completeStep', () => {
    it('should throw NotFoundException for non-existent organization', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(service.completeStep('invalid', 'categories', {})).rejects.toThrow(NotFoundException);
    });

    it('should add step to completedSteps', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', settings: { onboarding: { completedSteps: [] } } });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      await service.completeStep('org-1', 'categories', { categories: ['Vendas'] });
      expect(prisma.organization.update).toHaveBeenCalled();
    });

    it('should create products when step is products', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', settings: { onboarding: { completedSteps: [] } } });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      await service.completeStep('org-1', 'products', {
        products: [{ name: 'Produto A', sku: 'SKU-001', category: 'Vendas', salePrice: 100 }],
      });
      expect(prisma.product.create).toHaveBeenCalled();
    });

    it('should create workflows when step is workflows', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', settings: { onboarding: { completedSteps: [] } } });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      await service.completeStep('org-1', 'workflows', {
        workflows: [{ name: 'Notificar', trigger: 'ORDER_CREATED', steps: [{ type: 'NOTIFY', config: {} }] }],
      });
      expect(prisma.workflow.create).toHaveBeenCalled();
    });

    it('should not add duplicate step to completedSteps', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        settings: { onboarding: { completedSteps: ['categories'] } },
      });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      await service.completeStep('org-1', 'categories', {});
      const updateCall = prisma.organization.update.mock.calls[0][0];
      const steps = updateCall.data.settings.onboarding.completedSteps;
      expect(steps.filter((s: string) => s === 'categories')).toHaveLength(1);
    });
  });
});
