import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  WhatsAppProviderName,
  WhatsAppTemplateStatus,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  CreateWhatsAppConfigDto,
  UpdateWhatsAppConfigDto,
  CreateWhatsAppTemplateDto,
  UpdateWhatsAppTemplateDto,
  SendMessageDto,
  MessageFiltersDto,
  TemplateFiltersDto,
  ConfigFiltersDto,
} from './whatsapp.dto';
import { WhatsAppProvider, SendMessageResult, CreateTemplateInput } from './whatsapp-provider.interface';
import { MetaCloudProvider } from './providers/meta-cloud.provider';
import { EvolutionProvider } from './providers/evolution.provider';

// ── Provider Registry ────────────────────────────────────────────────────

const PROVIDER_MAP: Record<WhatsAppProviderName, new (...args: any[]) => WhatsAppProvider> = {
  [WhatsAppProviderName.META_CLOUD_API]: MetaCloudProvider,
  [WhatsAppProviderName.EVOLUTION_API]: EvolutionProvider,
  [WhatsAppProviderName.TWILIO]: EvolutionProvider, // placeholder
  [WhatsAppProviderName.ZENVIA]: EvolutionProvider, // placeholder
  [WhatsAppProviderName.WATI]: EvolutionProvider, // placeholder
};

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private prisma: PrismaService) {}

  // ── Provider Resolution ───────────────────────────────────────────────

  private getProvider(providerName: string): WhatsAppProvider {
    const ProviderClass = PROVIDER_MAP[providerName as WhatsAppProviderName];
    if (!ProviderClass) throw new NotFoundException(`Provider "${providerName}" não implementado`);
    return new ProviderClass();
  }

  // ── Config CRUD ───────────────────────────────────────────────────────

  async createConfig(orgId: string, dto: CreateWhatsAppConfigDto) {
    return this.prisma.whatsAppConfig.create({
      data: {
        organizationId: orgId,
        provider: dto.provider,
        isActive: dto.isActive ?? true,
        instanceName: dto.instanceName,
        apiKey: dto.apiKey,
        apiUrl: dto.apiUrl,
        phoneNumber: dto.phoneNumber,
        businessId: dto.businessId,
        webhookUrl: dto.webhookUrl,
        webhookSecret: dto.webhookSecret,
        settings: dto.settings ?? {},
      },
    });
  }

  async getConfigs(orgId: string, filters: ConfigFiltersDto) {
    const page = filters.page ?? 1;
    const perPage = Math.min(filters.perPage ?? 50, 100);
    const where: any = { organizationId: orgId };

    if (filters.provider) where.provider = filters.provider;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [data, total] = await Promise.all([
      this.prisma.whatsAppConfig.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: { _count: { select: { templates: true, messages: true } } },
      }),
      this.prisma.whatsAppConfig.count({ where }),
    ]);

    return { data, total, page, perPage };
  }

  async getConfig(orgId: string, id: string) {
    const config = await this.prisma.whatsAppConfig.findFirst({
      where: { id, organizationId: orgId },
      include: { _count: { select: { templates: true, messages: true } } },
    });
    if (!config) throw new NotFoundException('Configuração WhatsApp não encontrada');
    return config;
  }

  async updateConfig(orgId: string, id: string, dto: UpdateWhatsAppConfigDto) {
    await this.getConfig(orgId, id);

    const data: any = {};
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.instanceName !== undefined) data.instanceName = dto.instanceName;
    if (dto.apiKey !== undefined) data.apiKey = dto.apiKey;
    if (dto.apiUrl !== undefined) data.apiUrl = dto.apiUrl;
    if (dto.phoneNumber !== undefined) data.phoneNumber = dto.phoneNumber;
    if (dto.businessId !== undefined) data.businessId = dto.businessId;
    if (dto.webhookUrl !== undefined) data.webhookUrl = dto.webhookUrl;
    if (dto.webhookSecret !== undefined) data.webhookSecret = dto.webhookSecret;
    if (dto.settings !== undefined) data.settings = dto.settings;

    return this.prisma.whatsAppConfig.update({ where: { id }, data });
  }

  async deleteConfig(orgId: string, id: string) {
    await this.getConfig(orgId, id);
    return this.prisma.whatsAppConfig.delete({ where: { id } });
  }

  // ── Template CRUD ─────────────────────────────────────────────────────

  async createTemplate(orgId: string, dto: CreateWhatsAppTemplateDto) {
    // Validate config exists
    await this.getConfig(orgId, dto.configId);

    const template = await this.prisma.whatsAppTemplate.create({
      data: {
        organizationId: orgId,
        configId: dto.configId,
        name: dto.name,
        category: dto.category,
        language: dto.language ?? 'pt_BR',
        body: dto.body,
        header: dto.header,
        footer: dto.footer,
        buttons: dto.buttons ?? [],
        status: dto.status ?? WhatsAppTemplateStatus.PENDING,
        externalId: dto.externalId,
      },
    });

    // Try to create on external provider
    const config = await this.prisma.whatsAppConfig.findUnique({ where: { id: dto.configId } });
    if (config?.businessId && config.isActive) {
      try {
        const provider = this.getProvider(config.provider);
        const input: CreateTemplateInput = {
          name: dto.name,
          category: dto.category,
          language: dto.language ?? 'pt_BR',
          body: dto.body,
          header: dto.header,
          footer: dto.footer,
          buttons: dto.buttons,
        };
        const result = await provider.createTemplate(config.businessId, input);
        await this.prisma.whatsAppTemplate.update({
          where: { id: template.id },
          data: { externalId: result.externalId, status: result.status },
        });
      } catch (err) {
        this.logger.warn(`Falha ao criar template no provedor: ${(err as Error).message}`);
      }
    }

    return this.prisma.whatsAppTemplate.findUnique({ where: { id: template.id } });
  }

  async getTemplates(orgId: string, filters: TemplateFiltersDto) {
    const page = filters.page ?? 1;
    const perPage = Math.min(filters.perPage ?? 50, 100);
    const where: any = { organizationId: orgId };

    if (filters.status) where.status = filters.status;
    if (filters.configId) where.configId = filters.configId;

    const [data, total] = await Promise.all([
      this.prisma.whatsAppTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: { config: { select: { id: true, provider: true, instanceName: true } } },
      }),
      this.prisma.whatsAppTemplate.count({ where }),
    ]);

    return { data, total, page, perPage };
  }

  async getTemplate(orgId: string, id: string) {
    const template = await this.prisma.whatsAppTemplate.findFirst({
      where: { id, organizationId: orgId },
      include: { config: { select: { id: true, provider: true, instanceName: true } } },
    });
    if (!template) throw new NotFoundException('Template WhatsApp não encontrado');
    return template;
  }

  async updateTemplate(orgId: string, id: string, dto: UpdateWhatsAppTemplateDto) {
    await this.getTemplate(orgId, id);

    const data: any = {};
    if (dto.configId !== undefined) data.configId = dto.configId;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.language !== undefined) data.language = dto.language;
    if (dto.body !== undefined) data.body = dto.body;
    if (dto.header !== undefined) data.header = dto.header;
    if (dto.footer !== undefined) data.footer = dto.footer;
    if (dto.buttons !== undefined) data.buttons = dto.buttons;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.externalId !== undefined) data.externalId = dto.externalId;

    return this.prisma.whatsAppTemplate.update({ where: { id }, data });
  }

  async deleteTemplate(orgId: string, id: string) {
    await this.getTemplate(orgId, id);
    return this.prisma.whatsAppTemplate.delete({ where: { id } });
  }

  // ── Sync Templates from Provider ──────────────────────────────────────

  async syncTemplates(orgId: string, configId: string) {
    const config = await this.getConfig(orgId, configId);
    if (!config.businessId) throw new NotFoundException('Configuração não possui businessId para sincronizar templates');

    const provider = this.getProvider(config.provider);
    const externalTemplates = await provider.getTemplates(config.businessId);

    let synced = 0;
    for (const ext of externalTemplates) {
      const existing = await this.prisma.whatsAppTemplate.findFirst({
        where: { organizationId: orgId, externalId: ext.externalId },
      });

      if (existing) {
        await this.prisma.whatsAppTemplate.update({
          where: { id: existing.id },
          data: {
            status: ext.status,
            body: ext.body ?? existing.body,
            header: ext.header ?? existing.header,
            footer: ext.footer ?? existing.footer,
            buttons: ext.buttons ?? (existing.buttons as any[]),
          },
        });
      } else {
        await this.prisma.whatsAppTemplate.create({
          data: {
            organizationId: orgId,
            configId,
            name: ext.name,
            category: ext.category,
            language: ext.language,
            body: ext.body ?? '',
            header: ext.header,
            footer: ext.footer,
            buttons: ext.buttons ?? [],
            status: ext.status,
            externalId: ext.externalId,
          },
        });
      }
      synced++;
    }

    return { synced, total: externalTemplates.length };
  }

  // ── Send Message ──────────────────────────────────────────────────────

  async sendMessage(orgId: string, dto: SendMessageDto) {
    const config = await this.getConfig(orgId, dto.configId);
    if (!config.isActive) throw new NotFoundException('Configuração WhatsApp está inativa');

    const provider = this.getProvider(config.provider);
    const instanceId = config.instanceName || config.id;

    let result: SendMessageResult;

    if (dto.templateId) {
      // Template message
      const template = await this.getTemplate(orgId, dto.templateId);
      result = await provider.sendTemplate(
        instanceId,
        dto.phone,
        template.name,
        template.language,
        [{ type: 'body', parameters: [{ type: 'text', text: dto.content }] }],
      );
    } else {
      // Simple text message
      result = await provider.sendText(instanceId, dto.phone, dto.content);
    }

    // Persist message
    const message = await this.prisma.whatsAppMessage.create({
      data: {
        organizationId: orgId,
        configId: dto.configId,
        templateId: dto.templateId,
        customerId: dto.customerId,
        phone: dto.phone,
        direction: WhatsAppMessageDirection.OUTBOUND,
        status: result.status,
        content: dto.content,
        externalId: result.externalId,
        sentAt: result.timestamp ?? new Date(),
        metadata: dto.metadata ?? {},
      },
    });

    return message;
  }

  async getMessages(orgId: string, filters: MessageFiltersDto) {
    const page = filters.page ?? 1;
    const perPage = Math.min(filters.perPage ?? 50, 100);
    const where: any = { organizationId: orgId };

    if (filters.status) where.status = filters.status;
    if (filters.direction) where.direction = filters.direction;
    if (filters.phone) where.phone = { contains: filters.phone, mode: 'insensitive' };
    if (filters.configId) where.configId = filters.configId;
    if (filters.templateId) where.templateId = filters.templateId;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.whatsAppMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          config: { select: { id: true, provider: true } },
          template: { select: { id: true, name: true } },
        },
      }),
      this.prisma.whatsAppMessage.count({ where }),
    ]);

    return { data, total, page, perPage };
  }

  async getMessage(orgId: string, id: string) {
    const message = await this.prisma.whatsAppMessage.findFirst({
      where: { id, organizationId: orgId },
      include: {
        config: { select: { id: true, provider: true } },
        template: { select: { id: true, name: true } },
      },
    });
    if (!message) throw new NotFoundException('Mensagem WhatsApp não encontrada');
    return message;
  }

  // ── Webhook ───────────────────────────────────────────────────────────

  async handleWebhook(orgId: string, configId: string, payload: any, signature?: string) {
    const config = await this.getConfig(orgId, configId);
    const provider = this.getProvider(config.provider);
    const result = await provider.processWebhook(payload, signature);

    if (result.externalId) {
      // Try to find existing message by externalId
      const existing = await this.prisma.whatsAppMessage.findFirst({
        where: { externalId: result.externalId, organizationId: orgId },
      });

      if (existing) {
        // Update status of existing message
        const updateData: any = {};
        if (result.status === WhatsAppMessageStatus.DELIVERED) updateData.deliveredAt = result.timestamp ?? new Date();
        if (result.status === WhatsAppMessageStatus.READ) updateData.readAt = result.timestamp ?? new Date();
        if (result.status) updateData.status = result.status;

        if (Object.keys(updateData).length > 0) {
          await this.prisma.whatsAppMessage.update({
            where: { id: existing.id },
            data: updateData,
          });
        }
      } else if (result.direction === WhatsAppMessageDirection.INBOUND) {
        // Create inbound message
        await this.prisma.whatsAppMessage.create({
          data: {
            organizationId: orgId,
            configId,
            phone: result.phone || 'unknown',
            direction: WhatsAppMessageDirection.INBOUND,
            status: result.status || WhatsAppMessageStatus.DELIVERED,
            content: result.content || '',
            externalId: result.externalId,
            metadata: { eventType: result.eventType },
          },
        });
      }
    }

    return result;
  }

  // ── Instance Management ───────────────────────────────────────────────

  async connectInstance(orgId: string, configId: string) {
    const config = await this.getConfig(orgId, configId);
    const provider = this.getProvider(config.provider);
    const instanceId = config.instanceName || config.id;
    return provider.connectInstance(instanceId);
  }

  async disconnectInstance(orgId: string, configId: string) {
    const config = await this.getConfig(orgId, configId);
    const provider = this.getProvider(config.provider);
    const instanceId = config.instanceName || config.id;
    await provider.disconnectInstance(instanceId);
    return { status: 'disconnected' };
  }

  async getInstanceStatus(orgId: string, configId: string) {
    const config = await this.getConfig(orgId, configId);
    const provider = this.getProvider(config.provider);
    const instanceId = config.instanceName || config.id;
    return provider.getInstanceStatus(instanceId);
  }

  // ── Stats ─────────────────────────────────────────────────────────────

  async getStats(orgId: string) {
    const [totalConfigs, activeConfigs, totalTemplates, totalMessages] = await Promise.all([
      this.prisma.whatsAppConfig.count({ where: { organizationId: orgId } }),
      this.prisma.whatsAppConfig.count({ where: { organizationId: orgId, isActive: true } }),
      this.prisma.whatsAppTemplate.count({ where: { organizationId: orgId } }),
      this.prisma.whatsAppMessage.count({ where: { organizationId: orgId } }),
    ]);

    const messagesByStatus = await this.prisma.whatsAppMessage.groupBy({
      by: ['status'],
      where: { organizationId: orgId },
      _count: { id: true },
    });

    const messagesByDirection = await this.prisma.whatsAppMessage.groupBy({
      by: ['direction'],
      where: { organizationId: orgId },
      _count: { id: true },
    });

    const templatesByStatus = await this.prisma.whatsAppTemplate.groupBy({
      by: ['status'],
      where: { organizationId: orgId },
      _count: { id: true },
    });

    const configsByProvider = await this.prisma.whatsAppConfig.groupBy({
      by: ['provider'],
      where: { organizationId: orgId },
      _count: { id: true },
    });

    return {
      configs: { total: totalConfigs, active: activeConfigs, byProvider: configsByProvider.map((p) => ({ provider: p.provider, count: p._count.id })) },
      templates: { total: totalTemplates, byStatus: templatesByStatus.map((t) => ({ status: t.status, count: t._count.id })) },
      messages: {
        total: totalMessages,
        byStatus: messagesByStatus.map((m) => ({ status: m.status, count: m._count.id })),
        byDirection: messagesByDirection.map((m) => ({ direction: m.direction, count: m._count.id })),
      },
    };
  }
}
