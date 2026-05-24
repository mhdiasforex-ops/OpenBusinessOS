import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingService } from './onboarding.service';
import { NotFoundException } from '@nestjs/common';
import { EventTypes } from '@openbusinessos/event-definitions';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: any;
  let eventBus: any;
  let configGenerator: any;

  const mockConfig = {
    name: 'Varejo',
    categories: ['Vendas', 'Compras', 'Estoque', 'Despesas Fixas', 'Impostos'],
    defaultProducts: [
      { name: 'Produto A', unit: 'un', category: 'Vendas', salePrice: 100, costPrice: 50 },
    ],
    defaultWorkflows: [
      {
        name: 'Alerta de estoque baixo',
        trigger: 'STOCK_LOW',
        steps: [{ order: 1, type: 'SEND_EMAIL', config: { subject: 'Estoque baixo', to: 'owner' } }],
      },
    ],
    tips: ['Cadastre seus produtos com custo e preço de venda'],
  };

  beforeEach(() => {
    prisma = {
      organization: {
        update: vi.fn().mockResolvedValue({ id: 'org-1' }),
        findUnique: vi.fn().mockResolvedValue({ id: 'org-1', niche: 'RETAIL', settings: {} }),
      },
      product: { create: vi.fn().mockResolvedValue({ id: 'prod-1' }) },
      workflow: {
        create: vi.fn().mockResolvedValue({ id: 'wf-1' }),
      },
    } as any;
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) } as any;
    configGenerator = {
      getConfig: vi.fn().mockReturnValue(mockConfig),
    } as any;
    service = new OnboardingService(prisma, eventBus, configGenerator);
  });

  describe('getConfig', () => {
    it('should delegate to configGenerator.getConfig', async () => {
      const result = await service.getConfig('RETAIL');

      expect(configGenerator.getConfig).toHaveBeenCalledWith('RETAIL');
      expect(result).toEqual(mockConfig);
    });

    it('should return fallback config for unknown niche via delegation', async () => {
      configGenerator.getConfig.mockReturnValue(mockConfig);

      const result = await service.getConfig('UNKNOWN');

      expect(configGenerator.getConfig).toHaveBeenCalledWith('UNKNOWN');
      expect(result.name).toBe('Varejo');
    });
  });

  describe('startOnboarding', () => {
    it('should update organization niche and return steps config', async () => {
      const result = await service.startOnboarding('org-1', 'RETAIL');

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { niche: 'RETAIL' },
      });
      expect(configGenerator.getConfig).toHaveBeenCalledWith('RETAIL');
      expect(result.niche).toBe('Varejo');
      expect(result.steps).toHaveLength(4);
      expect(result.steps[0]).toEqual({
        id: 'categories',
        title: 'Categorias Financeiras',
        description: 'Configure as categorias de receita e despesa',
        preconfigured: mockConfig.categories,
      });
      expect(result.steps[1]).toEqual({
        id: 'products',
        title: 'Produtos/Serviços',
        description: 'Cadastre seus principais produtos e serviços',
        templates: mockConfig.defaultProducts,
      });
      expect(result.steps[2]).toEqual({
        id: 'workflows',
        title: 'Automações',
        description: 'Configure automações para seu negócio',
        templates: mockConfig.defaultWorkflows,
      });
      expect(result.steps[3]).toEqual({
        id: 'tips',
        title: 'Dicas',
        description: 'Dicas específicas para seu nicho',
        tips: mockConfig.tips,
      });
    });

    it('should pass through the niche value as-is to the update call', async () => {
      await service.startOnboarding('org-1', 'SERVICES');

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { niche: 'SERVICES' },
      });
    });
  });

  describe('completeStep', () => {
    it('should throw NotFoundException when organization does not exist', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.completeStep('invalid', 'categories', {})).rejects.toThrow(NotFoundException);
      await expect(service.completeStep('invalid', 'categories', {})).rejects.toThrow('Organização não encontrada');
    });

    it('should add step to completedSteps and store categories', async () => {
      const categoriesData = { categories: ['Vendas', 'Compras'] };
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        settings: { onboarding: { completedSteps: [] } },
      });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      const result = await service.completeStep('org-1', 'categories', categoriesData);

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: {
          settings: {
            onboarding: {
              completedSteps: ['categories'],
              categories: ['Vendas', 'Compras'],
            },
          },
        },
      });
      expect(result).toEqual({ stepId: 'categories', completed: true, totalSteps: 4, completedSteps: 1 });
    });

    it('should not add duplicate step to completedSteps', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        settings: { onboarding: { completedSteps: ['categories'] } },
      });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      await service.completeStep('org-1', 'categories', {});

      const updateCall = prisma.organization.update.mock.calls[0][0];
      const onboarding = updateCall.data.settings.onboarding;
      expect(onboarding.completedSteps).toEqual(['categories']);
    });

    it('should handle missing settings and onboarding gracefully', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', settings: null });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      const result = await service.completeStep('org-1', 'categories', { categories: ['Vendas'] });

      expect(result.completedSteps).toBe(1);
      const updateCall = prisma.organization.update.mock.calls[0][0];
      expect(updateCall.data.settings.onboarding.completedSteps).toEqual(['categories']);
    });

    it('should create products when step is products', async () => {
      const productsData = {
        products: [
          { name: 'Produto A', sku: 'SKU-001', category: 'Vendas', salePrice: 100, costPrice: 50, unit: 'un', minStock: 5 },
          { name: 'Produto B', category: 'Compras', salePrice: 200 },
        ],
      };
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        settings: { onboarding: { completedSteps: [] } },
      });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });
      prisma.product.create
        .mockResolvedValueOnce({ id: 'prod-1' })
        .mockResolvedValueOnce({ id: 'prod-2' });

      await service.completeStep('org-1', 'products', productsData);

      expect(prisma.product.create).toHaveBeenCalledTimes(2);
      expect(prisma.product.create).toHaveBeenNthCalledWith(1, {
        data: {
          organizationId: 'org-1',
          name: 'Produto A',
          sku: 'SKU-001',
          category: 'Vendas',
          costPrice: 50,
          salePrice: 100,
          unit: 'un',
          minStock: 5,
        },
      });
      expect(prisma.product.create).toHaveBeenNthCalledWith(2, {
        data: {
          organizationId: 'org-1',
          name: 'Produto B',
          sku: expect.stringMatching(/^SKU-/),
          category: 'Compras',
          costPrice: 0,
          salePrice: 200,
          unit: 'un',
          minStock: 5,
        },
      });
    });

    it('should do nothing when products step has no products data', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        settings: { onboarding: { completedSteps: [] } },
      });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      await service.completeStep('org-1', 'products', {});

      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('should create workflows when step is workflows', async () => {
      const workflowsData = {
        workflows: [
          {
            name: 'Notificar',
            trigger: 'ORDER_CREATED',
            steps: [
              { type: 'SEND_EMAIL', config: { to: 'admin' }, fallback: null },
              { type: 'SEND_SMS', config: { phone: '11999999999' }, fallback: null },
            ],
          },
        ],
      };
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        settings: { onboarding: { completedSteps: [] } },
      });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      await service.completeStep('org-1', 'workflows', workflowsData);

      expect(prisma.workflow.create).toHaveBeenCalledTimes(1);
      expect(prisma.workflow.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          name: 'Notificar',
          trigger: 'ORDER_CREATED',
          isActive: true,
          steps: {
            create: [
              { organizationId: 'org-1', order: 1, type: 'SEND_EMAIL', config: { to: 'admin' }, fallback: null },
              { organizationId: 'org-1', order: 2, type: 'SEND_SMS', config: { phone: '11999999999' }, fallback: null },
            ],
          },
        },
      });
    });

    it('should handle workflow with no steps defined', async () => {
      const workflowsData = {
        workflows: [{ name: 'Simple', trigger: 'EVENT', steps: null }],
      };
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        settings: { onboarding: { completedSteps: [] } },
      });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      await service.completeStep('org-1', 'workflows', workflowsData);

      expect(prisma.workflow.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          name: 'Simple',
          trigger: 'EVENT',
          isActive: true,
          steps: { create: [] },
        },
      });
    });

    it('should do nothing when workflows step has no workflows data', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        settings: { onboarding: { completedSteps: [] } },
      });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      await service.completeStep('org-1', 'workflows', {});

      expect(prisma.workflow.create).not.toHaveBeenCalled();
    });

    it('should return correct completed steps count', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        settings: { onboarding: { completedSteps: ['categories'] } },
      });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      const result = await service.completeStep('org-1', 'products', {});

      expect(result.completedSteps).toBe(2);
    });
  });

  describe('completeOnboarding', () => {
    it('should mark onboarding as completed and emit event', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        niche: 'RETAIL',
        settings: {
          onboarding: { completedSteps: ['categories', 'products'], categories: ['Vendas'] },
        },
      });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      const result = await service.completeOnboarding('org-1');

      const updateCall = prisma.organization.update.mock.calls[0][0];
      const onboarding = updateCall.data.settings.onboarding;
      expect(onboarding.completed).toBe(true);
      expect(onboarding.completedAt).toBeDefined();
      expect(onboarding.categories).toEqual(['Vendas']);

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: 'org-1',
        type: EventTypes.ONBOARDING_COMPLETED,
        source: 'onboarding-service',
        payload: {
          organizationId: 'org-1',
          niche: 'RETAIL',
          completedSteps: ['categories', 'products'],
        },
      });
      expect(result).toEqual({ message: 'Onboarding concluído!', niche: 'RETAIL' });
    });

    it('should handle org with no settings', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', niche: 'SERVICES', settings: null });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      const result = await service.completeOnboarding('org-1');

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: 'org-1',
        type: EventTypes.ONBOARDING_COMPLETED,
        source: 'onboarding-service',
        payload: {
          organizationId: 'org-1',
          niche: 'SERVICES',
          completedSteps: [],
        },
      });
      expect(result.message).toBe('Onboarding concluído!');
    });

    it('should handle org with no onboarding progress', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', niche: 'FOOD', settings: {} });
      prisma.organization.update.mockResolvedValue({ id: 'org-1' });

      await service.completeOnboarding('org-1');

      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ completedSteps: [] }),
        }),
      );
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.completeOnboarding('invalid')).rejects.toThrow(NotFoundException);
      await expect(service.completeOnboarding('invalid')).rejects.toThrow('Organização não encontrada');
      expect(prisma.organization.update).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalled();
    });
  });
});
