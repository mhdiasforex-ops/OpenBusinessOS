import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import {
  WhatsAppProviderName,
  WhatsAppTemplateStatus,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
} from './whatsapp.dto';
import type { ConfigFiltersDto, TemplateFiltersDto, MessageFiltersDto } from './whatsapp.dto';

const mockProvider = vi.hoisted(() => ({
  name: 'META_CLOUD_API',
  createInstance: vi.fn(),
  connectInstance: vi.fn().mockResolvedValue({ status: 'connected' }),
  disconnectInstance: vi.fn().mockResolvedValue(undefined),
  getInstanceStatus: vi.fn().mockResolvedValue({ status: 'connected', phone: '5511999999999' }),
  deleteInstance: vi.fn(),
  sendText: vi.fn(),
  sendTemplate: vi.fn(),
  sendMedia: vi.fn(),
  createTemplate: vi.fn(),
  getTemplates: vi.fn(),
  deleteTemplate: vi.fn(),
  processWebhook: vi.fn(),
}));

vi.mock('./providers/meta-cloud.provider', () => ({
  MetaCloudProvider: vi.fn().mockImplementation(() => mockProvider),
}));

vi.mock('./providers/evolution.provider', () => ({
  EvolutionProvider: vi.fn().mockImplementation(() => mockProvider),
}));

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let prisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      whatsAppConfig: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        groupBy: vi.fn(),
      },
      whatsAppTemplate: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        groupBy: vi.fn(),
      },
      whatsAppMessage: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        groupBy: vi.fn(),
      },
    };

    service = new WhatsAppService(prisma);
  });

  const orgId = 'org-123';

  // ────────────────────────────────────────────────
  //  Config CRUD
  // ────────────────────────────────────────────────

  describe('createConfig', () => {
    it('should create a config with all fields', async () => {
      const dto = {
        provider: WhatsAppProviderName.META_CLOUD_API,
        isActive: true,
        instanceName: 'MyInstance',
        apiKey: 'key-123',
        apiUrl: 'https://api.example.com',
        phoneNumber: '5511999999999',
        businessId: 'biz-123',
        webhookUrl: 'https://hooks.example.com',
        webhookSecret: 'secret-123',
        settings: { env: 'prod' },
      };
      const expected = { id: 'cfg-1', organizationId: orgId, ...dto };
      prisma.whatsAppConfig.create.mockResolvedValue(expected);

      const result = await service.createConfig(orgId, dto);

      expect(prisma.whatsAppConfig.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          provider: dto.provider,
          isActive: true,
          instanceName: 'MyInstance',
          apiKey: 'key-123',
          apiUrl: 'https://api.example.com',
          phoneNumber: '5511999999999',
          businessId: 'biz-123',
          webhookUrl: 'https://hooks.example.com',
          webhookSecret: 'secret-123',
          settings: { env: 'prod' },
        },
      });
      expect(result).toEqual(expected);
    });

    it('should default isActive to true', async () => {
      const dto = { provider: WhatsAppProviderName.EVOLUTION_API };
      prisma.whatsAppConfig.create.mockResolvedValue({ id: 'cfg-1' });
      await service.createConfig(orgId, dto);

      expect(prisma.whatsAppConfig.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isActive: true }) }),
      );
    });

    it('should default settings to empty object', async () => {
      const dto = { provider: WhatsAppProviderName.EVOLUTION_API };
      prisma.whatsAppConfig.create.mockResolvedValue({ id: 'cfg-1' });
      await service.createConfig(orgId, dto);

      expect(prisma.whatsAppConfig.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ settings: {} }) }),
      );
    });

    it('should pass isActive false when provided', async () => {
      const dto = { provider: WhatsAppProviderName.EVOLUTION_API, isActive: false };
      prisma.whatsAppConfig.create.mockResolvedValue({ id: 'cfg-1' });
      await service.createConfig(orgId, dto);

      expect(prisma.whatsAppConfig.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isActive: false }) }),
      );
    });
  });

  describe('getConfigs', () => {
    const baseConfig = { id: 'cfg-1', provider: 'META_CLOUD_API', isActive: true, _count: { templates: 3, messages: 10 } };

    it('should return paginated configs with counts', async () => {
      prisma.whatsAppConfig.findMany.mockResolvedValue([baseConfig]);
      prisma.whatsAppConfig.count.mockResolvedValue(25);

      const result = await service.getConfigs(orgId, { page: 2, perPage: 10 } as ConfigFiltersDto);

      expect(result).toEqual({ data: [baseConfig], total: 25, page: 2, perPage: 10 });
      expect(prisma.whatsAppConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10, where: { organizationId: orgId } }),
      );
    });

    it('should filter by provider', async () => {
      prisma.whatsAppConfig.findMany.mockResolvedValue([]);
      prisma.whatsAppConfig.count.mockResolvedValue(0);

      await service.getConfigs(orgId, { provider: WhatsAppProviderName.META_CLOUD_API } as ConfigFiltersDto);

      const call = prisma.whatsAppConfig.findMany.mock.calls[0][0];
      expect(call.where.provider).toBe(WhatsAppProviderName.META_CLOUD_API);
    });

    it('should filter by isActive', async () => {
      prisma.whatsAppConfig.findMany.mockResolvedValue([]);
      prisma.whatsAppConfig.count.mockResolvedValue(0);

      await service.getConfigs(orgId, { isActive: true } as ConfigFiltersDto);

      expect(prisma.whatsAppConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
      );
    });

    it('should cap perPage at 100', async () => {
      prisma.whatsAppConfig.findMany.mockResolvedValue([]);
      prisma.whatsAppConfig.count.mockResolvedValue(0);

      await service.getConfigs(orgId, { perPage: 500 } as ConfigFiltersDto);

      expect(prisma.whatsAppConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should default page and perPage', async () => {
      prisma.whatsAppConfig.findMany.mockResolvedValue([]);
      prisma.whatsAppConfig.count.mockResolvedValue(0);

      await service.getConfigs(orgId, {} as ConfigFiltersDto);

      expect(prisma.whatsAppConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 50 }),
      );
    });

    it('should include _count for templates and messages', async () => {
      prisma.whatsAppConfig.findMany.mockResolvedValue([baseConfig]);
      prisma.whatsAppConfig.count.mockResolvedValue(1);

      await service.getConfigs(orgId, {} as ConfigFiltersDto);

      expect(prisma.whatsAppConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { _count: { select: { templates: true, messages: true } } },
        }),
      );
    });
  });

  describe('getConfig', () => {
    it('should return config with counts', async () => {
      const config = { id: 'cfg-1', organizationId: orgId, _count: { templates: 5, messages: 20 } };
      prisma.whatsAppConfig.findFirst.mockResolvedValue(config);

      const result = await service.getConfig(orgId, 'cfg-1');

      expect(result).toEqual(config);
      expect(prisma.whatsAppConfig.findFirst).toHaveBeenCalledWith({
        where: { id: 'cfg-1', organizationId: orgId },
        include: { _count: { select: { templates: true, messages: true } } },
      });
    });

    it('should throw NotFoundException when config does not exist', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(null);

      await expect(service.getConfig(orgId, 'cfg-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateConfig', () => {
    it('should partially update a config', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({ id: 'cfg-1', organizationId: orgId });
      const updated = { id: 'cfg-1', instanceName: 'Updated', phoneNumber: '5511888888888' };
      prisma.whatsAppConfig.update.mockResolvedValue(updated);

      const result = await service.updateConfig(orgId, 'cfg-1', { instanceName: 'Updated', phoneNumber: '5511888888888' });

      expect(prisma.whatsAppConfig.update).toHaveBeenCalledWith({
        where: { id: 'cfg-1' },
        data: { instanceName: 'Updated', phoneNumber: '5511888888888' },
      });
      expect(result).toEqual(updated);
    });

    it('should only include defined fields in update data', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({ id: 'cfg-1', organizationId: orgId });
      prisma.whatsAppConfig.update.mockResolvedValue({ id: 'cfg-1' });

      await service.updateConfig(orgId, 'cfg-1', { isActive: false });

      const call = prisma.whatsAppConfig.update.mock.calls[0][0];
      expect(call.data).toEqual({ isActive: false });
    });

    it('should update settings when provided', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({ id: 'cfg-1', organizationId: orgId });
      prisma.whatsAppConfig.update.mockResolvedValue({ id: 'cfg-1' });

      await service.updateConfig(orgId, 'cfg-1', { settings: { newKey: 'val' } });

      const call = prisma.whatsAppConfig.update.mock.calls[0][0];
      expect(call.data.settings).toEqual({ newKey: 'val' });
    });

    it('should throw NotFoundException when config does not exist', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(null);

      await expect(service.updateConfig(orgId, 'cfg-999', {})).rejects.toThrow(NotFoundException);
    });

    it('should not call update if getConfig throws', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(null);

      await expect(service.updateConfig(orgId, 'cfg-999', { instanceName: 'X' })).rejects.toThrow(NotFoundException);
      expect(prisma.whatsAppConfig.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteConfig', () => {
    it('should delete an existing config', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({ id: 'cfg-1', organizationId: orgId });
      prisma.whatsAppConfig.delete.mockResolvedValue({ id: 'cfg-1' });

      const result = await service.deleteConfig(orgId, 'cfg-1');

      expect(prisma.whatsAppConfig.delete).toHaveBeenCalledWith({ where: { id: 'cfg-1' } });
      expect(result).toEqual({ id: 'cfg-1' });
    });

    it('should throw NotFoundException when config does not exist', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(null);

      await expect(service.deleteConfig(orgId, 'cfg-999')).rejects.toThrow(NotFoundException);
      expect(prisma.whatsAppConfig.delete).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────
  //  Template CRUD
  // ────────────────────────────────────────────────

  describe('createTemplate', () => {
    const dto = {
      configId: 'cfg-1',
      name: 'welcome',
      category: 'MARKETING',
      language: 'en_US' as const,
      body: 'Hello {{1}}',
      header: 'Hi',
      footer: 'Thanks',
      buttons: [{ type: 'URL', text: 'Visit' }],
    };

    it('should validate config exists then create template', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({ id: 'cfg-1', organizationId: orgId });
      prisma.whatsAppConfig.findUnique.mockResolvedValue({ id: 'cfg-1', businessId: null, isActive: false });
      prisma.whatsAppTemplate.create.mockResolvedValue({ id: 'tmpl-1', ...dto, organizationId: orgId, status: 'PENDING' });
      prisma.whatsAppTemplate.findUnique.mockResolvedValue({ id: 'tmpl-1', ...dto, organizationId: orgId, status: 'PENDING' });

      const result = await service.createTemplate(orgId, dto);

      expect(prisma.whatsAppConfig.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'cfg-1', organizationId: orgId } }),
      );
      expect(prisma.whatsAppTemplate.create).toHaveBeenCalled();
      expect(mockProvider.createTemplate).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should default language to pt_BR', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({ id: 'cfg-1', organizationId: orgId });
      prisma.whatsAppConfig.findUnique.mockResolvedValue({ id: 'cfg-1', businessId: null, isActive: false });
      prisma.whatsAppTemplate.create.mockResolvedValue({ id: 'tmpl-1' });
      prisma.whatsAppTemplate.findUnique.mockResolvedValue({ id: 'tmpl-1' });

      await service.createTemplate(orgId, { configId: 'cfg-1', name: 't', category: 'UTILITY', body: 'hi' });

      const createCall = prisma.whatsAppTemplate.create.mock.calls[0][0];
      expect(createCall.data.language).toBe('pt_BR');
    });

    it('should default buttons to empty array', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({ id: 'cfg-1', organizationId: orgId });
      prisma.whatsAppConfig.findUnique.mockResolvedValue({ id: 'cfg-1', businessId: null, isActive: false });
      prisma.whatsAppTemplate.create.mockResolvedValue({ id: 'tmpl-1' });
      prisma.whatsAppTemplate.findUnique.mockResolvedValue({ id: 'tmpl-1' });

      await service.createTemplate(orgId, { configId: 'cfg-1', name: 't', category: 'UTILITY', body: 'hi' });

      const createCall = prisma.whatsAppTemplate.create.mock.calls[0][0];
      expect(createCall.data.buttons).toEqual([]);
    });

    it('should default status to PENDING', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({ id: 'cfg-1', organizationId: orgId });
      prisma.whatsAppConfig.findUnique.mockResolvedValue({ id: 'cfg-1', businessId: null, isActive: false });
      prisma.whatsAppTemplate.create.mockResolvedValue({ id: 'tmpl-1' });
      prisma.whatsAppTemplate.findUnique.mockResolvedValue({ id: 'tmpl-1' });

      await service.createTemplate(orgId, { configId: 'cfg-1', name: 't', category: 'UTILITY', body: 'hi' });

      const createCall = prisma.whatsAppTemplate.create.mock.calls[0][0];
      expect(createCall.data.status).toBe('PENDING');
    });

    it('should sync to provider when businessId is set and config is active', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({ id: 'cfg-1', organizationId: orgId });
      prisma.whatsAppConfig.findUnique.mockResolvedValue({ id: 'cfg-1', businessId: 'biz-123', isActive: true, provider: 'META_CLOUD_API' });
      prisma.whatsAppTemplate.create.mockResolvedValue({ id: 'tmpl-1', ...dto, organizationId: orgId });
      mockProvider.createTemplate.mockResolvedValue({ externalId: 'ext-abc', status: WhatsAppTemplateStatus.APPROVED });
      prisma.whatsAppTemplate.update.mockResolvedValue({ id: 'tmpl-1', externalId: 'ext-abc', status: WhatsAppTemplateStatus.APPROVED });
      prisma.whatsAppTemplate.findUnique.mockResolvedValue({ id: 'tmpl-1', externalId: 'ext-abc', status: WhatsAppTemplateStatus.APPROVED });

      const result = await service.createTemplate(orgId, dto);

      expect(mockProvider.createTemplate).toHaveBeenCalledWith('biz-123', {
        name: 'welcome',
        category: 'MARKETING',
        language: 'en_US',
        body: 'Hello {{1}}',
        header: 'Hi',
        footer: 'Thanks',
        buttons: [{ type: 'URL', text: 'Visit' }],
      });
      expect(prisma.whatsAppTemplate.update).toHaveBeenCalledWith({
        where: { id: 'tmpl-1' },
        data: { externalId: 'ext-abc', status: WhatsAppTemplateStatus.APPROVED },
      });
    });

    it('should NOT sync to provider when config has no businessId', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({ id: 'cfg-1', organizationId: orgId });
      prisma.whatsAppConfig.findUnique.mockResolvedValue({ id: 'cfg-1', businessId: null, isActive: true, provider: 'META_CLOUD_API' });
      prisma.whatsAppTemplate.create.mockResolvedValue({ id: 'tmpl-1' });
      prisma.whatsAppTemplate.findUnique.mockResolvedValue({ id: 'tmpl-1' });

      await service.createTemplate(orgId, dto);

      expect(mockProvider.createTemplate).not.toHaveBeenCalled();
    });

    it('should NOT sync to provider when config is inactive', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({ id: 'cfg-1', organizationId: orgId });
      prisma.whatsAppConfig.findUnique.mockResolvedValue({ id: 'cfg-1', businessId: 'biz-123', isActive: false, provider: 'META_CLOUD_API' });
      prisma.whatsAppTemplate.create.mockResolvedValue({ id: 'tmpl-1' });
      prisma.whatsAppTemplate.findUnique.mockResolvedValue({ id: 'tmpl-1' });

      await service.createTemplate(orgId, dto);

      expect(mockProvider.createTemplate).not.toHaveBeenCalled();
    });

    it('should handle provider sync failure gracefully', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({ id: 'cfg-1', organizationId: orgId });
      prisma.whatsAppConfig.findUnique.mockResolvedValue({ id: 'cfg-1', businessId: 'biz-123', isActive: true, provider: 'META_CLOUD_API' });
      prisma.whatsAppTemplate.create.mockResolvedValue({ id: 'tmpl-1' });
      mockProvider.createTemplate.mockRejectedValue(new Error('API error'));
      prisma.whatsAppTemplate.findUnique.mockResolvedValue({ id: 'tmpl-1' });

      const result = await service.createTemplate(orgId, dto);

      expect(mockProvider.createTemplate).toHaveBeenCalled();
      expect(prisma.whatsAppTemplate.update).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when config does not exist', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(null);

      await expect(service.createTemplate(orgId, dto)).rejects.toThrow(NotFoundException);
      expect(prisma.whatsAppTemplate.create).not.toHaveBeenCalled();
    });
  });

  describe('getTemplates', () => {
    const baseTemplate = {
      id: 'tmpl-1',
      name: 'welcome',
      status: 'APPROVED',
      config: { id: 'cfg-1', provider: 'META_CLOUD_API', instanceName: 'Inst' },
    };

    it('should return paginated templates with config info', async () => {
      prisma.whatsAppTemplate.findMany.mockResolvedValue([baseTemplate]);
      prisma.whatsAppTemplate.count.mockResolvedValue(10);

      const result = await service.getTemplates(orgId, { page: 1, perPage: 10 } as TemplateFiltersDto);

      expect(result).toEqual({ data: [baseTemplate], total: 10, page: 1, perPage: 10 });
      expect(prisma.whatsAppTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });

    it('should filter by status', async () => {
      prisma.whatsAppTemplate.findMany.mockResolvedValue([]);
      prisma.whatsAppTemplate.count.mockResolvedValue(0);

      await service.getTemplates(orgId, { status: 'APPROVED' } as TemplateFiltersDto);

      expect(prisma.whatsAppTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'APPROVED' }) }),
      );
    });

    it('should filter by configId', async () => {
      prisma.whatsAppTemplate.findMany.mockResolvedValue([]);
      prisma.whatsAppTemplate.count.mockResolvedValue(0);

      await service.getTemplates(orgId, { configId: 'cfg-1' } as TemplateFiltersDto);

      expect(prisma.whatsAppTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ configId: 'cfg-1' }) }),
      );
    });
  });

  describe('getTemplate', () => {
    it('should return template with config', async () => {
      const template = { id: 'tmpl-1', organizationId: orgId, config: { id: 'cfg-1', provider: 'META_CLOUD_API', instanceName: 'Inst' } };
      prisma.whatsAppTemplate.findFirst.mockResolvedValue(template);

      const result = await service.getTemplate(orgId, 'tmpl-1');

      expect(result).toEqual(template);
      expect(prisma.whatsAppTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: 'tmpl-1', organizationId: orgId },
        include: { config: { select: { id: true, provider: true, instanceName: true } } },
      });
    });

    it('should throw NotFoundException when template does not exist', async () => {
      prisma.whatsAppTemplate.findFirst.mockResolvedValue(null);

      await expect(service.getTemplate(orgId, 'tmpl-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTemplate', () => {
    it('should partially update a template', async () => {
      prisma.whatsAppTemplate.findFirst.mockResolvedValue({ id: 'tmpl-1', organizationId: orgId });
      prisma.whatsAppTemplate.update.mockResolvedValue({ id: 'tmpl-1', name: 'new-name' });

      const result = await service.updateTemplate(orgId, 'tmpl-1', { name: 'new-name' });

      expect(prisma.whatsAppTemplate.update).toHaveBeenCalledWith({
        where: { id: 'tmpl-1' },
        data: { name: 'new-name' },
      });
      expect(result).toEqual({ id: 'tmpl-1', name: 'new-name' });
    });

    it('should only include defined fields', async () => {
      prisma.whatsAppTemplate.findFirst.mockResolvedValue({ id: 'tmpl-1', organizationId: orgId });
      prisma.whatsAppTemplate.update.mockResolvedValue({ id: 'tmpl-1' });

      await service.updateTemplate(orgId, 'tmpl-1', { status: 'REJECTED' as any, externalId: 'ext-new' });

      const call = prisma.whatsAppTemplate.update.mock.calls[0][0];
      expect(call.data).toEqual({ status: 'REJECTED', externalId: 'ext-new' });
      expect(call.data.name).toBeUndefined();
    });

    it('should throw NotFoundException when template does not exist', async () => {
      prisma.whatsAppTemplate.findFirst.mockResolvedValue(null);

      await expect(service.updateTemplate(orgId, 'tmpl-999', {} as any)).rejects.toThrow(NotFoundException);
      expect(prisma.whatsAppTemplate.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteTemplate', () => {
    it('should delete an existing template', async () => {
      prisma.whatsAppTemplate.findFirst.mockResolvedValue({ id: 'tmpl-1', organizationId: orgId });
      prisma.whatsAppTemplate.delete.mockResolvedValue({ id: 'tmpl-1' });

      await service.deleteTemplate(orgId, 'tmpl-1');

      expect(prisma.whatsAppTemplate.delete).toHaveBeenCalledWith({ where: { id: 'tmpl-1' } });
    });

    it('should throw NotFoundException when template does not exist', async () => {
      prisma.whatsAppTemplate.findFirst.mockResolvedValue(null);

      await expect(service.deleteTemplate(orgId, 'tmpl-999')).rejects.toThrow(NotFoundException);
      expect(prisma.whatsAppTemplate.delete).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────
  //  Sync Templates
  // ────────────────────────────────────────────────

  describe('syncTemplates', () => {
    it('should sync templates from provider', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({
        id: 'cfg-1', organizationId: orgId, businessId: 'biz-123', provider: 'META_CLOUD_API',
      });
      mockProvider.getTemplates.mockResolvedValue([
        { externalId: 'ext-1', name: 'welcome', category: 'MARKETING', language: 'pt_BR', status: 'APPROVED', body: 'Hello', header: 'Hi', footer: 'Bye', buttons: [] },
      ]);
      prisma.whatsAppTemplate.findFirst.mockResolvedValue(null);
      prisma.whatsAppTemplate.create.mockResolvedValue({ id: 'tmpl-new' });

      const result = await service.syncTemplates(orgId, 'cfg-1');

      expect(result).toEqual({ synced: 1, total: 1 });
      expect(prisma.whatsAppTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'welcome', externalId: 'ext-1', status: 'APPROVED' }),
        }),
      );
    });

    it('should update existing templates during sync', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({
        id: 'cfg-1', organizationId: orgId, businessId: 'biz-123', provider: 'META_CLOUD_API',
      });
      mockProvider.getTemplates.mockResolvedValue([
        { externalId: 'ext-1', name: 'welcome', category: 'MARKETING', language: 'pt_BR', status: 'APPROVED', body: 'Updated body', buttons: [] },
      ]);
      prisma.whatsAppTemplate.findFirst.mockResolvedValue({ id: 'existing-1', organizationId: orgId, buttons: [] });

      const result = await service.syncTemplates(orgId, 'cfg-1');

      expect(result).toEqual({ synced: 1, total: 1 });
      expect(prisma.whatsAppTemplate.create).not.toHaveBeenCalled();
      expect(prisma.whatsAppTemplate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'existing-1' },
          data: expect.objectContaining({ status: 'APPROVED', body: 'Updated body' }),
        }),
      );
    });

    it('should handle multiple external templates', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({
        id: 'cfg-1', organizationId: orgId, businessId: 'biz-123', provider: 'META_CLOUD_API',
      });
      mockProvider.getTemplates.mockResolvedValue([
        { externalId: 'ext-1', name: 't1', category: 'C1', language: 'pt_BR', status: 'APPROVED' },
        { externalId: 'ext-2', name: 't2', category: 'C2', language: 'en', status: 'PENDING' },
      ]);
      prisma.whatsAppTemplate.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      prisma.whatsAppTemplate.create.mockResolvedValue({ id: 'new' });

      const result = await service.syncTemplates(orgId, 'cfg-1');

      expect(result).toEqual({ synced: 2, total: 2 });
      expect(prisma.whatsAppTemplate.create).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException when config has no businessId', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({
        id: 'cfg-1', organizationId: orgId, businessId: null, provider: 'META_CLOUD_API',
      });

      await expect(service.syncTemplates(orgId, 'cfg-1')).rejects.toThrow(NotFoundException);
      expect(mockProvider.getTemplates).not.toHaveBeenCalled();
    });

    it('should default body to empty string when not provided in external template', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({
        id: 'cfg-1', organizationId: orgId, businessId: 'biz-123', provider: 'META_CLOUD_API',
      });
      mockProvider.getTemplates.mockResolvedValue([
        { externalId: 'ext-1', name: 't1', category: 'C1', language: 'pt_BR', status: 'APPROVED' },
      ]);
      prisma.whatsAppTemplate.findFirst.mockResolvedValue(null);

      await service.syncTemplates(orgId, 'cfg-1');

      expect(prisma.whatsAppTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ body: '' }) }),
      );
    });
  });

  // ────────────────────────────────────────────────
  //  Send Message
  // ────────────────────────────────────────────────

  describe('sendMessage', () => {
    const config = { id: 'cfg-1', organizationId: orgId, isActive: true, provider: 'META_CLOUD_API', instanceName: 'Inst' };

    it('should send a text message', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(config);
      mockProvider.sendText.mockResolvedValue({ externalId: 'ext-msg-1', status: WhatsAppMessageStatus.SENT, timestamp: new Date('2025-01-01') });
      prisma.whatsAppMessage.create.mockResolvedValue({ id: 'msg-1', externalId: 'ext-msg-1' });

      const result = await service.sendMessage(orgId, {
        configId: 'cfg-1',
        phone: '5511999999999',
        content: 'Hello world',
        customerId: 'cust-1',
        metadata: { source: 'test' },
      });

      expect(mockProvider.sendText).toHaveBeenCalledWith('Inst', '5511999999999', 'Hello world');
      expect(prisma.whatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '5511999999999',
            direction: 'outbound',
            content: 'Hello world',
            externalId: 'ext-msg-1',
            customerId: 'cust-1',
            configId: 'cfg-1',
            templateId: undefined,
          }),
        }),
      );
      expect(result).toEqual({ id: 'msg-1', externalId: 'ext-msg-1' });
    });

    it('should use config id as instanceId when instanceName is not set', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({
        ...config, instanceName: undefined,
      });
      mockProvider.sendText.mockResolvedValue({ externalId: 'ext-1', status: WhatsAppMessageStatus.SENT });
      prisma.whatsAppMessage.create.mockResolvedValue({ id: 'msg-1' });

      await service.sendMessage(orgId, { configId: 'cfg-1', phone: '5511999999999', content: 'Hi' });

      expect(mockProvider.sendText).toHaveBeenCalledWith('cfg-1', '5511999999999', 'Hi');
    });

    it('should send a template message', async () => {
      const template = { id: 'tmpl-1', name: 'welcome', language: 'pt_BR' };
      prisma.whatsAppConfig.findFirst.mockResolvedValue(config);
      prisma.whatsAppTemplate.findFirst.mockResolvedValue(template);
      mockProvider.sendTemplate.mockResolvedValue({ externalId: 'ext-msg-2', status: WhatsAppMessageStatus.SENT, timestamp: new Date('2025-01-01') });
      prisma.whatsAppMessage.create.mockResolvedValue({ id: 'msg-2' });

      const result = await service.sendMessage(orgId, {
        configId: 'cfg-1',
        templateId: 'tmpl-1',
        phone: '5511999999999',
        content: 'Hello {{1}}',
      });

      expect(mockProvider.sendTemplate).toHaveBeenCalledWith(
        'Inst',
        '5511999999999',
        'welcome',
        'pt_BR',
        [{ type: 'body', parameters: [{ type: 'text', text: 'Hello {{1}}' }] }],
      );
      expect(prisma.whatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ templateId: 'tmpl-1' }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when config is inactive', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({ ...config, isActive: false });

      await expect(service.sendMessage(orgId, { configId: 'cfg-1', phone: '5511999999999', content: 'Hi' })).rejects.toThrow(NotFoundException);
      expect(mockProvider.sendText).not.toHaveBeenCalled();
    });

    it('should throw when template not found in template message', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(config);
      prisma.whatsAppTemplate.findFirst.mockResolvedValue(null);

      await expect(service.sendMessage(orgId, {
        configId: 'cfg-1', templateId: 'tmpl-999', phone: '5511999999999', content: 'Hi',
      })).rejects.toThrow(NotFoundException);
      expect(mockProvider.sendTemplate).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────
  //  Get Messages
  // ────────────────────────────────────────────────

  describe('getMessages', () => {
    it('should return paginated messages with config and template info', async () => {
      const messages = [{ id: 'msg-1', status: 'sent', config: { id: 'cfg-1', provider: 'META' }, template: { id: 'tmpl-1', name: 'welcome' } }];
      prisma.whatsAppMessage.findMany.mockResolvedValue(messages);
      prisma.whatsAppMessage.count.mockResolvedValue(50);

      const result = await service.getMessages(orgId, { page: 1, perPage: 20 } as MessageFiltersDto);

      expect(result).toEqual({ data: messages, total: 50, page: 1, perPage: 20 });
    });

    it('should filter by status', async () => {
      prisma.whatsAppMessage.findMany.mockResolvedValue([]);
      prisma.whatsAppMessage.count.mockResolvedValue(0);

      await service.getMessages(orgId, { status: 'delivered' } as MessageFiltersDto);

      expect(prisma.whatsAppMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'delivered' }) }),
      );
    });

    it('should filter by direction', async () => {
      prisma.whatsAppMessage.findMany.mockResolvedValue([]);
      prisma.whatsAppMessage.count.mockResolvedValue(0);

      await service.getMessages(orgId, { direction: 'inbound' } as MessageFiltersDto);

      expect(prisma.whatsAppMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ direction: 'inbound' }) }),
      );
    });

    it('should filter by phone with insensitive contains', async () => {
      prisma.whatsAppMessage.findMany.mockResolvedValue([]);
      prisma.whatsAppMessage.count.mockResolvedValue(0);

      await service.getMessages(orgId, { phone: '55119' } as MessageFiltersDto);

      const where = prisma.whatsAppMessage.findMany.mock.calls[0][0].where;
      expect(where.phone).toEqual({ contains: '55119', mode: 'insensitive' });
    });

    it('should filter by configId', async () => {
      prisma.whatsAppMessage.findMany.mockResolvedValue([]);
      prisma.whatsAppMessage.count.mockResolvedValue(0);

      await service.getMessages(orgId, { configId: 'cfg-1' } as MessageFiltersDto);

      expect(prisma.whatsAppMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ configId: 'cfg-1' }) }),
      );
    });

    it('should filter by templateId', async () => {
      prisma.whatsAppMessage.findMany.mockResolvedValue([]);
      prisma.whatsAppMessage.count.mockResolvedValue(0);

      await service.getMessages(orgId, { templateId: 'tmpl-1' } as MessageFiltersDto);

      expect(prisma.whatsAppMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ templateId: 'tmpl-1' }) }),
      );
    });

    it('should filter by customerId', async () => {
      prisma.whatsAppMessage.findMany.mockResolvedValue([]);
      prisma.whatsAppMessage.count.mockResolvedValue(0);

      await service.getMessages(orgId, { customerId: 'cust-1' } as MessageFiltersDto);

      expect(prisma.whatsAppMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ customerId: 'cust-1' }) }),
      );
    });

    it('should filter by date range', async () => {
      prisma.whatsAppMessage.findMany.mockResolvedValue([]);
      prisma.whatsAppMessage.count.mockResolvedValue(0);

      await service.getMessages(orgId, { startDate: '2025-01-01', endDate: '2025-12-31' } as MessageFiltersDto);

      const where = prisma.whatsAppMessage.findMany.mock.calls[0][0].where;
      expect(where.createdAt.gte).toEqual(new Date('2025-01-01'));
      expect(where.createdAt.lte).toEqual(new Date('2025-12-31'));
    });

    it('should filter by startDate only', async () => {
      prisma.whatsAppMessage.findMany.mockResolvedValue([]);
      prisma.whatsAppMessage.count.mockResolvedValue(0);

      await service.getMessages(orgId, { startDate: '2025-06-01' } as MessageFiltersDto);

      const where = prisma.whatsAppMessage.findMany.mock.calls[0][0].where;
      expect(where.createdAt.gte).toEqual(new Date('2025-06-01'));
      expect(where.createdAt.lte).toBeUndefined();
    });
  });

  describe('getMessage', () => {
    it('should return message with includes', async () => {
      const msg = { id: 'msg-1', organizationId: orgId, config: { id: 'cfg-1', provider: 'META' }, template: { id: 'tmpl-1', name: 'welcome' } };
      prisma.whatsAppMessage.findFirst.mockResolvedValue(msg);

      const result = await service.getMessage(orgId, 'msg-1');

      expect(result).toEqual(msg);
      expect(prisma.whatsAppMessage.findFirst).toHaveBeenCalledWith({
        where: { id: 'msg-1', organizationId: orgId },
        include: {
          config: { select: { id: true, provider: true } },
          template: { select: { id: true, name: true } },
        },
      });
    });

    it('should throw NotFoundException when message does not exist', async () => {
      prisma.whatsAppMessage.findFirst.mockResolvedValue(null);

      await expect(service.getMessage(orgId, 'msg-999')).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────
  //  Webhook
  // ────────────────────────────────────────────────

  describe('handleWebhook', () => {
    const config = { id: 'cfg-1', organizationId: orgId, provider: 'META_CLOUD_API' };

    it('should update status of existing message on delivery receipt', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(config);
      const now = new Date('2025-03-01T12:00:00Z');
      mockProvider.processWebhook.mockResolvedValue({
        externalId: 'ext-msg-1',
        direction: WhatsAppMessageDirection.OUTBOUND,
        status: WhatsAppMessageStatus.DELIVERED,
        timestamp: now,
      });
      prisma.whatsAppMessage.findFirst.mockResolvedValue({ id: 'msg-1' });
      prisma.whatsAppMessage.update.mockResolvedValue({ id: 'msg-1' });

      const result = await service.handleWebhook(orgId, 'cfg-1', { some: 'payload' }, 'sig');

      expect(mockProvider.processWebhook).toHaveBeenCalledWith({ some: 'payload' }, 'sig');
      expect(prisma.whatsAppMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: { deliveredAt: now, status: WhatsAppMessageStatus.DELIVERED },
      });
      expect(result).toEqual({
        externalId: 'ext-msg-1',
        direction: 'outbound',
        status: 'delivered',
        timestamp: now,
      });
    });

    it('should set readAt when status is READ', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(config);
      const now = new Date('2025-03-01T13:00:00Z');
      mockProvider.processWebhook.mockResolvedValue({
        externalId: 'ext-msg-1',
        direction: WhatsAppMessageDirection.OUTBOUND,
        status: WhatsAppMessageStatus.READ,
        timestamp: now,
      });
      prisma.whatsAppMessage.findFirst.mockResolvedValue({ id: 'msg-1' });
      prisma.whatsAppMessage.update.mockResolvedValue({ id: 'msg-1' });

      await service.handleWebhook(orgId, 'cfg-1', {});

      expect(prisma.whatsAppMessage.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: { readAt: now, status: WhatsAppMessageStatus.READ },
      });
    });

    it('should create inbound message when no existing message found', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(config);
      const now = new Date('2025-03-01T14:00:00Z');
      mockProvider.processWebhook.mockResolvedValue({
        externalId: 'ext-inbound-1',
        direction: WhatsAppMessageDirection.INBOUND,
        status: WhatsAppMessageStatus.DELIVERED,
        content: 'Hello from customer',
        phone: '5511888888888',
        timestamp: now,
        eventType: 'message.received',
      });
      prisma.whatsAppMessage.findFirst.mockResolvedValue(null);
      prisma.whatsAppMessage.create.mockResolvedValue({ id: 'msg-new' });

      await service.handleWebhook(orgId, 'cfg-1', {});

      expect(prisma.whatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            configId: 'cfg-1',
            phone: '5511888888888',
            direction: 'inbound',
            status: 'delivered',
            content: 'Hello from customer',
            externalId: 'ext-inbound-1',
            metadata: { eventType: 'message.received' },
          }),
        }),
      );
    });

    it('should not create inbound message when direction is outbound', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(config);
      mockProvider.processWebhook.mockResolvedValue({
        externalId: 'ext-outbound-1',
        direction: WhatsAppMessageDirection.OUTBOUND,
      });
      prisma.whatsAppMessage.findFirst.mockResolvedValue(null);

      await service.handleWebhook(orgId, 'cfg-1', {});

      expect(prisma.whatsAppMessage.create).not.toHaveBeenCalled();
      expect(prisma.whatsAppMessage.update).not.toHaveBeenCalled();
    });

    it('should not update message when result has no externalId', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(config);
      mockProvider.processWebhook.mockResolvedValue({
        externalId: undefined,
        direction: WhatsAppMessageDirection.OUTBOUND,
      });

      await service.handleWebhook(orgId, 'cfg-1', {});

      expect(prisma.whatsAppMessage.findFirst).not.toHaveBeenCalled();
      expect(prisma.whatsAppMessage.update).not.toHaveBeenCalled();
      expect(prisma.whatsAppMessage.create).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────
  //  Instance Management
  // ────────────────────────────────────────────────

  describe('connectInstance', () => {
    it('should connect the provider instance', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({
        id: 'cfg-1', organizationId: orgId, provider: 'META_CLOUD_API', instanceName: 'inst-1',
      });
      mockProvider.connectInstance.mockResolvedValue({ status: 'connected', qrCode: 'qr-data' });

      const result = await service.connectInstance(orgId, 'cfg-1');

      expect(mockProvider.connectInstance).toHaveBeenCalledWith('inst-1');
      expect(result).toEqual({ status: 'connected', qrCode: 'qr-data' });
    });

    it('should use config id as instanceId when instanceName is not set', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({
        id: 'cfg-1', organizationId: orgId, provider: 'META_CLOUD_API', instanceName: undefined,
      });
      mockProvider.connectInstance.mockResolvedValue({ status: 'connected' });

      await service.connectInstance(orgId, 'cfg-1');

      expect(mockProvider.connectInstance).toHaveBeenCalledWith('cfg-1');
    });

    it('should throw when config not found', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(null);

      await expect(service.connectInstance(orgId, 'cfg-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('disconnectInstance', () => {
    it('should disconnect the provider instance', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({
        id: 'cfg-1', organizationId: orgId, provider: 'META_CLOUD_API', instanceName: 'inst-1',
      });
      mockProvider.disconnectInstance.mockResolvedValue(undefined);

      const result = await service.disconnectInstance(orgId, 'cfg-1');

      expect(mockProvider.disconnectInstance).toHaveBeenCalledWith('inst-1');
      expect(result).toEqual({ status: 'disconnected' });
    });

    it('should use config id when instanceName not set', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({
        id: 'cfg-1', organizationId: orgId, provider: 'EVOLUTION_API', instanceName: undefined,
      });

      await service.disconnectInstance(orgId, 'cfg-1');

      expect(mockProvider.disconnectInstance).toHaveBeenCalledWith('cfg-1');
    });

    it('should throw when config not found', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(null);

      await expect(service.disconnectInstance(orgId, 'cfg-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInstanceStatus', () => {
    it('should return instance status from provider', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue({
        id: 'cfg-1', organizationId: orgId, provider: 'META_CLOUD_API', instanceName: 'inst-1',
      });
      mockProvider.getInstanceStatus.mockResolvedValue({ status: 'connected', phone: '5511999999999' });

      const result = await service.getInstanceStatus(orgId, 'cfg-1');

      expect(mockProvider.getInstanceStatus).toHaveBeenCalledWith('inst-1');
      expect(result).toEqual({ status: 'connected', phone: '5511999999999' });
    });

    it('should throw when config not found', async () => {
      prisma.whatsAppConfig.findFirst.mockResolvedValue(null);

      await expect(service.getInstanceStatus(orgId, 'cfg-999')).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────
  //  Stats
  // ────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return aggregated stats with groupBy data', async () => {
      prisma.whatsAppConfig.count.mockResolvedValueOnce(5).mockResolvedValueOnce(3);
      prisma.whatsAppTemplate.count.mockResolvedValue(10);
      prisma.whatsAppMessage.count.mockResolvedValue(100);

      prisma.whatsAppMessage.groupBy
        .mockResolvedValueOnce([
          { status: 'sent', _count: { id: 60 } },
          { status: 'delivered', _count: { id: 40 } },
        ])
        .mockResolvedValueOnce([
          { direction: 'outbound', _count: { id: 80 } },
          { direction: 'inbound', _count: { id: 20 } },
        ]);

      prisma.whatsAppTemplate.groupBy.mockResolvedValue([
        { status: 'APPROVED', _count: { id: 8 } },
        { status: 'PENDING', _count: { id: 2 } },
      ]);

      prisma.whatsAppConfig.groupBy.mockResolvedValue([
        { provider: 'META_CLOUD_API', _count: { id: 3 } },
        { provider: 'EVOLUTION_API', _count: { id: 2 } },
      ]);

      const result = await service.getStats(orgId);

      expect(result).toEqual({
        configs: {
          total: 5,
          active: 3,
          byProvider: [
            { provider: 'META_CLOUD_API', count: 3 },
            { provider: 'EVOLUTION_API', count: 2 },
          ],
        },
        templates: {
          total: 10,
          byStatus: [
            { status: 'APPROVED', count: 8 },
            { status: 'PENDING', count: 2 },
          ],
        },
        messages: {
          total: 100,
          byStatus: [
            { status: 'sent', count: 60 },
            { status: 'delivered', count: 40 },
          ],
          byDirection: [
            { direction: 'outbound', count: 80 },
            { direction: 'inbound', count: 20 },
          ],
        },
      });
    });

    it('should return empty arrays when no groupBy data', async () => {
      prisma.whatsAppConfig.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      prisma.whatsAppTemplate.count.mockResolvedValue(0);
      prisma.whatsAppMessage.count.mockResolvedValue(0);
      prisma.whatsAppMessage.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      prisma.whatsAppTemplate.groupBy.mockResolvedValue([]);
      prisma.whatsAppConfig.groupBy.mockResolvedValue([]);

      const result = await service.getStats(orgId);

      expect(result.configs.byProvider).toEqual([]);
      expect(result.templates.byStatus).toEqual([]);
      expect(result.messages.byStatus).toEqual([]);
      expect(result.messages.byDirection).toEqual([]);
    });
  });
});
