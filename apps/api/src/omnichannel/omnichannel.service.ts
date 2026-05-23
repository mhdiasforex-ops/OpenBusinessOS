import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import {
  SendWhatsAppDto,
  SendEmailDto,
  SendSmsDto,
  ReplyConversationDto,
  CreateTemplateDto,
} from './omnichannel.dto';

@Injectable()
export class OmnichannelService {
  private readonly logger = new Logger(OmnichannelService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  // --- WhatsApp ---

  async sendWhatsApp(orgId: string, dto: SendWhatsAppDto, userId: string) {
    this.logger.log(`Sending WhatsApp message to ${dto.to} for org ${orgId}`);

    // TODO: Integrate with WhatsApp API (Twilio, Z-API, etc.)
    const result = {
      id: `wa_${Date.now()}`,
      organizationId: orgId,
      to: dto.to,
      message: dto.message,
      templateId: dto.templateId || null,
      contactId: dto.contactId || null,
      status: 'SENT',
      channel: 'whatsapp',
      createdAt: new Date().toISOString(),
    };

    await this.eventBus.emit({
      organizationId: orgId,
      type: 'omnichannel.whatsapp.sent',
      source: 'omnichannel-service',
      payload: {
        messageId: result.id,
        to: dto.to,
        channel: 'whatsapp',
        sentBy: userId,
      },
    });

    return result;
  }

  async receiveWhatsAppWebhook(orgId: string, payload: any) {
    this.logger.log(`Received WhatsApp webhook for org ${orgId}`);

    // TODO: Validate webhook signature and process incoming message
    const result = {
      id: `webhook_wa_${Date.now()}`,
      organizationId: orgId,
      from: payload.from || 'unknown',
      message: payload.body || payload.text || '',
      channel: 'whatsapp',
      receivedAt: new Date().toISOString(),
      status: 'RECEIVED',
    };

    await this.eventBus.emit({
      organizationId: orgId,
      type: 'omnichannel.whatsapp.received',
      source: 'omnichannel-service',
      payload: {
        webhookId: result.id,
        from: result.from,
        channel: 'whatsapp',
      },
    });

    return result;
  }

  // --- Email ---

  async sendEmail(orgId: string, dto: SendEmailDto, userId: string) {
    this.logger.log(`Sending email to ${dto.to} for org ${orgId}`);

    // TODO: Integrate with email provider (SendGrid, SES, etc.)
    const result = {
      id: `email_${Date.now()}`,
      organizationId: orgId,
      to: dto.to,
      subject: dto.subject,
      body: dto.body,
      isHtml: dto.isHtml ?? true,
      templateId: dto.templateId || null,
      contactId: dto.contactId || null,
      attachments: dto.attachments || [],
      status: 'SENT',
      channel: 'email',
      createdAt: new Date().toISOString(),
    };

    await this.eventBus.emit({
      organizationId: orgId,
      type: 'omnichannel.email.sent',
      source: 'omnichannel-service',
      payload: {
        messageId: result.id,
        to: dto.to,
        subject: dto.subject,
        channel: 'email',
        sentBy: userId,
      },
    });

    return result;
  }

  // --- SMS ---

  async sendSms(orgId: string, dto: SendSmsDto, userId: string) {
    this.logger.log(`Sending SMS to ${dto.to} for org ${orgId}`);

    // TODO: Integrate with SMS provider (Twilio, SNS, etc.)
    const result = {
      id: `sms_${Date.now()}`,
      organizationId: orgId,
      to: dto.to,
      message: dto.message,
      contactId: dto.contactId || null,
      status: 'SENT',
      channel: 'sms',
      createdAt: new Date().toISOString(),
    };

    await this.eventBus.emit({
      organizationId: orgId,
      type: 'omnichannel.sms.sent',
      source: 'omnichannel-service',
      payload: {
        messageId: result.id,
        to: dto.to,
        channel: 'sms',
        sentBy: userId,
      },
    });

    return result;
  }

  // --- Conversations ---

  async getConversations(orgId: string, filters: { channel?: string; status?: string; page?: number; perPage?: number }) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 25;

    // TODO: Replace with actual Prisma queries when Conversation model is added
    const mockData = [
      {
        id: 'conv_001',
        organizationId: orgId,
        contactId: 'contact_001',
        contactName: 'João Silva',
        channel: 'whatsapp',
        status: 'OPEN',
        lastMessage: 'Olá, preciso de ajuda com meu pedido.',
        lastMessageAt: new Date().toISOString(),
        createdAt: '2026-05-20T10:00:00Z',
        unreadCount: 2,
      },
      {
        id: 'conv_002',
        organizationId: orgId,
        contactId: 'contact_002',
        contactName: 'Maria Santos',
        channel: 'email',
        status: 'OPEN',
        lastMessage: 'Gostaria de saber sobre o prazo de entrega.',
        lastMessageAt: new Date().toISOString(),
        createdAt: '2026-05-21T14:30:00Z',
        unreadCount: 1,
      },
      {
        id: 'conv_003',
        organizationId: orgId,
        contactId: 'contact_003',
        contactName: 'Pedro Oliveira',
        channel: 'sms',
        status: 'RESOLVED',
        lastMessage: 'Obrigado pelo atendimento!',
        lastMessageAt: '2026-05-19T16:00:00Z',
        createdAt: '2026-05-18T09:00:00Z',
        unreadCount: 0,
      },
    ];

    let filtered = mockData;
    if (filters.channel) filtered = filtered.filter(c => c.channel === filters.channel);
    if (filters.status) filtered = filtered.filter(c => c.status === filters.status);

    return {
      data: filtered.slice((page - 1) * perPage, page * perPage),
      total: filtered.length,
      page,
      perPage,
      totalPages: Math.ceil(filtered.length / perPage),
    };
  }

  async getConversation(orgId: string, id: string) {
    // TODO: Replace with actual Prisma query
    const mockConversation = {
      id,
      organizationId: orgId,
      contactId: 'contact_001',
      contactName: 'João Silva',
      channel: 'whatsapp',
      status: 'OPEN',
      messages: [
        {
          id: 'msg_001',
          direction: 'INBOUND',
          content: 'Olá, preciso de ajuda com meu pedido.',
          channel: 'whatsapp',
          createdAt: '2026-05-20T10:00:00Z',
        },
        {
          id: 'msg_002',
          direction: 'OUTBOUND',
          content: 'Claro! Pode me informar o número do pedido?',
          channel: 'whatsapp',
          createdAt: '2026-05-20T10:01:00Z',
        },
        {
          id: 'msg_003',
          direction: 'INBOUND',
          content: 'O número é PED-2026-001.',
          channel: 'whatsapp',
          createdAt: '2026-05-20T10:02:00Z',
        },
      ],
      createdAt: '2026-05-20T10:00:00Z',
      updatedAt: new Date().toISOString(),
    };

    return mockConversation;
  }

  async replyConversation(orgId: string, id: string, dto: ReplyConversationDto, userId: string) {
    this.logger.log(`Replying to conversation ${id} via ${dto.channel} for org ${orgId}`);

    // TODO: Integrate with actual channel APIs and persist message
    const result = {
      id: `msg_${Date.now()}`,
      conversationId: id,
      organizationId: orgId,
      direction: 'OUTBOUND',
      content: dto.message,
      channel: dto.channel,
      templateId: dto.templateId || null,
      sentBy: userId,
      createdAt: new Date().toISOString(),
      status: 'SENT',
    };

    await this.eventBus.emit({
      organizationId: orgId,
      type: 'omnichannel.conversation.replied',
      source: 'omnichannel-service',
      payload: {
        conversationId: id,
        messageId: result.id,
        channel: dto.channel,
        repliedBy: userId,
      },
    });

    return result;
  }

  // --- Templates ---

  async getTemplates(orgId: string, filters: { channel?: string; category?: string }) {
    // TODO: Replace with actual Prisma query
    const mockTemplates = [
      {
        id: 'tpl_001',
        organizationId: orgId,
        name: 'Boas-vindas WhatsApp',
        channel: 'whatsapp',
        content: 'Olá {{nome}}, bem-vindo à {{empresa}}!',
        category: 'onboarding',
        variables: ['nome', 'empresa'],
        createdAt: '2026-01-15T10:00:00Z',
      },
      {
        id: 'tpl_002',
        organizationId: orgId,
        name: 'Confirmação de Pedido',
        channel: 'email',
        content: '<p>Olá {{nome}}, seu pedido {{pedido_id}} foi confirmado!</p>',
        subject: 'Confirmação de Pedido #{{pedido_id}}',
        category: 'transactional',
        variables: ['nome', 'pedido_id'],
        createdAt: '2026-02-10T14:00:00Z',
      },
      {
        id: 'tpl_003',
        organizationId: orgId,
        name: 'Código de Verificação SMS',
        channel: 'sms',
        content: 'Seu código de verificação é {{codigo}}. Válido por 5 minutos.',
        category: 'authentication',
        variables: ['codigo'],
        createdAt: '2026-03-05T09:00:00Z',
      },
    ];

    let filtered = mockTemplates;
    if (filters.channel) filtered = filtered.filter(t => t.channel === filters.channel);
    if (filters.category) filtered = filtered.filter(t => t.category === filters.category);

    return filtered;
  }

  async createTemplate(orgId: string, dto: CreateTemplateDto, userId: string) {
    this.logger.log(`Creating template "${dto.name}" for org ${orgId}`);

    // TODO: Persist with Prisma when Template model is added
    const result = {
      id: `tpl_${Date.now()}`,
      organizationId: orgId,
      name: dto.name,
      channel: dto.channel,
      content: dto.content,
      subject: dto.subject || null,
      category: dto.category || null,
      variables: dto.variables || [],
      createdAt: new Date().toISOString(),
    };

    await this.eventBus.emit({
      organizationId: orgId,
      type: 'omnichannel.template.created',
      source: 'omnichannel-service',
      payload: {
        templateId: result.id,
        channel: dto.channel,
        createdBy: userId,
      },
    });

    return result;
  }

  // --- Channel Status ---

  async getChannelStatus(orgId: string) {
    // TODO: Check actual channel connectivity and configuration
    return {
      channels: [
        {
          id: 'ch_whatsapp',
          name: 'WhatsApp',
          type: 'whatsapp',
          status: 'CONNECTED',
          provider: 'Z-API',
          lastActivityAt: new Date().toISOString(),
          config: {
            phoneNumber: '+5511999999999',
            businessName: 'BusinessOS Demo',
          },
        },
        {
          id: 'ch_email',
          name: 'Email',
          type: 'email',
          status: 'CONNECTED',
          provider: 'SendGrid',
          lastActivityAt: new Date().toISOString(),
          config: {
            fromAddress: 'contato@businessos.com',
            fromName: 'BusinessOS',
          },
        },
        {
          id: 'ch_sms',
          name: 'SMS',
          type: 'sms',
          status: 'DISCONNECTED',
          provider: 'Twilio',
          lastActivityAt: '2026-05-10T08:00:00Z',
          config: {
            phoneNumber: '+5511999999999',
          },
        },
      ],
      summary: {
        total: 3,
        connected: 2,
        disconnected: 1,
      },
    };
  }
}
