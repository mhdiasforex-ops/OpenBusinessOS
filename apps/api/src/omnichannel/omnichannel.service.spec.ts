import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OmnichannelService } from './omnichannel.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';

describe('OmnichannelService', () => {
  let service: OmnichannelService;
  let prisma: any;
  let eventBus: any;

  const orgId = 'org-123';
  const userId = 'user-1';

  beforeEach(() => {
    prisma = {};
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) };
    service = new OmnichannelService(
      prisma as unknown as PrismaService,
      eventBus as unknown as EventBusService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendWhatsApp', () => {
    const dto = {
      to: '+5511999999999',
      message: 'Olá, como podemos ajudar?',
      templateId: 'tpl_abc123',
      contactId: 'contact_001',
    };

    it('should send WhatsApp message and return result with SENT status', async () => {
      const result = await service.sendWhatsApp(orgId, dto, userId);

      expect(result).toMatchObject({
        organizationId: orgId,
        to: dto.to,
        message: dto.message,
        templateId: dto.templateId,
        contactId: dto.contactId,
        status: 'SENT',
        channel: 'whatsapp',
      });
      expect(result.id).toMatch(/^wa_/);
      expect(result.createdAt).toBeDefined();
    });

    it('should set templateId and contactId to null when not provided', async () => {
      const result = await service.sendWhatsApp(orgId, { to: '+5511999999999', message: 'test' }, userId);

      expect(result.templateId).toBeNull();
      expect(result.contactId).toBeNull();
    });

    it('should emit omnichannel.whatsapp.sent event', async () => {
      const result = await service.sendWhatsApp(orgId, dto, userId);

      expect(eventBus.emit).toHaveBeenCalledWith({
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
    });
  });

  describe('receiveWhatsAppWebhook', () => {
    it('should process webhook payload and return RECEIVED status', async () => {
      const payload = { from: '+5511999999999', body: 'Olá, quero saber sobre meu pedido.' };

      const result = await service.receiveWhatsAppWebhook(orgId, payload);

      expect(result).toMatchObject({
        organizationId: orgId,
        from: payload.from,
        message: payload.body,
        channel: 'whatsapp',
        status: 'RECEIVED',
      });
      expect(result.id).toMatch(/^webhook_wa_/);
    });

    it('should fallback to payload.text when payload.body is missing', async () => {
      const payload = { from: '+5511999999999', text: 'Mensagem via text field' };

      const result = await service.receiveWhatsAppWebhook(orgId, payload);

      expect(result.message).toBe(payload.text);
    });

    it('should default from to "unknown" when not provided', async () => {
      const payload = { body: 'test' };

      const result = await service.receiveWhatsAppWebhook(orgId, payload);

      expect(result.from).toBe('unknown');
    });

    it('should emit omnichannel.whatsapp.received event', async () => {
      const payload = { from: '+5511999999999', body: 'test' };

      const result = await service.receiveWhatsAppWebhook(orgId, payload);

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'omnichannel.whatsapp.received',
        source: 'omnichannel-service',
        payload: {
          webhookId: result.id,
          from: result.from,
          channel: 'whatsapp',
        },
      });
    });
  });

  describe('sendEmail', () => {
    const dto = {
      to: 'cliente@empresa.com',
      subject: 'Confirmação de pedido',
      body: '<p>Seu pedido foi confirmado!</p>',
      isHtml: true,
      templateId: 'tpl_email_01',
      contactId: 'contact_001',
      attachments: ['file_001'],
    };

    it('should send email and return result with SENT status', async () => {
      const result = await service.sendEmail(orgId, dto, userId);

      expect(result).toMatchObject({
        organizationId: orgId,
        to: dto.to,
        subject: dto.subject,
        body: dto.body,
        isHtml: true,
        templateId: dto.templateId,
        contactId: dto.contactId,
        attachments: dto.attachments,
        status: 'SENT',
        channel: 'email',
      });
      expect(result.id).toMatch(/^email_/);
    });

    it('should default isHtml to true when not provided', async () => {
      const result = await service.sendEmail(orgId, { to: 'a@b.com', subject: 's', body: 'b' }, userId);

      expect(result.isHtml).toBe(true);
    });

    it('should default attachments to empty array when not provided', async () => {
      const result = await service.sendEmail(orgId, { to: 'a@b.com', subject: 's', body: 'b' }, userId);

      expect(result.attachments).toEqual([]);
    });

    it('should set templateId and contactId to null when not provided', async () => {
      const result = await service.sendEmail(orgId, { to: 'a@b.com', subject: 's', body: 'b' }, userId);

      expect(result.templateId).toBeNull();
      expect(result.contactId).toBeNull();
    });

    it('should emit omnichannel.email.sent event', async () => {
      const result = await service.sendEmail(orgId, dto, userId);

      expect(eventBus.emit).toHaveBeenCalledWith({
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
    });
  });

  describe('sendSms', () => {
    const dto = {
      to: '+5511999999999',
      message: 'Seu código de verificação é 123456',
      contactId: 'contact_001',
    };

    it('should send SMS and return result with SENT status', async () => {
      const result = await service.sendSms(orgId, dto, userId);

      expect(result).toMatchObject({
        organizationId: orgId,
        to: dto.to,
        message: dto.message,
        contactId: dto.contactId,
        status: 'SENT',
        channel: 'sms',
      });
      expect(result.id).toMatch(/^sms_/);
    });

    it('should set contactId to null when not provided', async () => {
      const result = await service.sendSms(orgId, { to: '+5511999999999', message: 'test' }, userId);

      expect(result.contactId).toBeNull();
    });

    it('should emit omnichannel.sms.sent event', async () => {
      const result = await service.sendSms(orgId, dto, userId);

      expect(eventBus.emit).toHaveBeenCalledWith({
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
    });
  });

  describe('getConversations', () => {
    it('should return paginated conversations with default page and perPage', async () => {
      const result = await service.getConversations(orgId, {});

      expect(result.page).toBe(1);
      expect(result.perPage).toBe(25);
      expect(result.total).toBe(3);
      expect(result.data).toHaveLength(3);
    });

    it('should filter conversations by channel', async () => {
      const result = await service.getConversations(orgId, { channel: 'whatsapp' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].channel).toBe('whatsapp');
      expect(result.total).toBe(1);
    });

    it('should filter conversations by status', async () => {
      const result = await service.getConversations(orgId, { status: 'RESOLVED' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('RESOLVED');
    });

    it('should filter by both channel and status', async () => {
      const result = await service.getConversations(orgId, { channel: 'email', status: 'OPEN' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].channel).toBe('email');
      expect(result.data[0].status).toBe('OPEN');
    });

    it('should return empty array when no conversations match filters', async () => {
      const result = await service.getConversations(orgId, { channel: 'messenger' });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should paginate results correctly', async () => {
      const result = await service.getConversations(orgId, { page: 1, perPage: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.totalPages).toBe(2);
    });

    it('should calculate totalPages correctly', async () => {
      const result = await service.getConversations(orgId, { perPage: 2 });

      expect(result.totalPages).toBe(2);
    });

    it('should return page 2 with perPage 2', async () => {
      const result = await service.getConversations(orgId, { page: 2, perPage: 2 });

      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(2);
    });
  });

  describe('getConversation', () => {
    it('should return conversation mock with messages', async () => {
      const result = await service.getConversation(orgId, 'conv_001');

      expect(result).toMatchObject({
        id: 'conv_001',
        organizationId: orgId,
        messages: expect.any(Array),
      });
      expect(result.messages).toHaveLength(3);
    });

    it('should include messages with direction, content, and channel', async () => {
      const result = await service.getConversation(orgId, 'conv_001');

      expect(result.messages[0]).toMatchObject({
        direction: 'INBOUND',
        channel: 'whatsapp',
      });
      expect(result.messages[1]).toMatchObject({ direction: 'OUTBOUND' });
    });
  });

  describe('replyConversation', () => {
    const convId = 'conv_001';
    const dto = {
      message: 'Claro! Vou verificar para você.',
      channel: 'whatsapp' as const,
      templateId: 'tpl_001',
    };

    it('should reply to conversation and return result with SENT status', async () => {
      const result = await service.replyConversation(orgId, convId, dto, userId);

      expect(result).toMatchObject({
        conversationId: convId,
        organizationId: orgId,
        direction: 'OUTBOUND',
        content: dto.message,
        channel: dto.channel,
        templateId: dto.templateId,
        sentBy: userId,
        status: 'SENT',
      });
      expect(result.id).toMatch(/^msg_/);
    });

    it('should set templateId to null when not provided', async () => {
      const result = await service.replyConversation(orgId, convId, { message: 'ok', channel: 'email' as const }, userId);

      expect(result.templateId).toBeNull();
    });

    it('should emit omnichannel.conversation.replied event', async () => {
      const result = await service.replyConversation(orgId, convId, dto, userId);

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'omnichannel.conversation.replied',
        source: 'omnichannel-service',
        payload: {
          conversationId: convId,
          messageId: result.id,
          channel: dto.channel,
          repliedBy: userId,
        },
      });
    });
  });

  describe('getTemplates', () => {
    it('should return all templates when no filters provided', async () => {
      const result = await service.getTemplates(orgId, {});

      expect(result).toHaveLength(3);
    });

    it('should filter templates by channel', async () => {
      const result = await service.getTemplates(orgId, { channel: 'whatsapp' });

      expect(result).toHaveLength(1);
      expect(result[0].channel).toBe('whatsapp');
    });

    it('should filter templates by category', async () => {
      const result = await service.getTemplates(orgId, { category: 'transactional' });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('transactional');
    });

    it('should filter by both channel and category', async () => {
      const result = await service.getTemplates(orgId, { channel: 'sms', category: 'authentication' });

      expect(result).toHaveLength(1);
      expect(result[0].channel).toBe('sms');
      expect(result[0].category).toBe('authentication');
    });

    it('should return empty array when no templates match filters', async () => {
      const result = await service.getTemplates(orgId, { channel: 'messenger' });

      expect(result).toEqual([]);
    });

    it('should return templates with all expected properties', async () => {
      const [template] = await service.getTemplates(orgId, { channel: 'whatsapp' });

      expect(template).toMatchObject({
        id: expect.any(String),
        organizationId: orgId,
        name: expect.any(String),
        channel: 'whatsapp',
        content: expect.any(String),
        category: expect.any(String),
        variables: expect.any(Array),
      });
    });
  });

  describe('createTemplate', () => {
    const dto = {
      name: 'Boas-vindas WhatsApp',
      channel: 'whatsapp' as const,
      content: 'Olá {{nome}}, bem-vindo!',
      subject: 'Bem-vindo',
      category: 'onboarding',
      variables: ['nome'],
    };

    it('should create template and return result', async () => {
      const result = await service.createTemplate(orgId, dto, userId);

      expect(result).toMatchObject({
        organizationId: orgId,
        name: dto.name,
        channel: dto.channel,
        content: dto.content,
        subject: dto.subject,
        category: dto.category,
        variables: dto.variables,
      });
      expect(result.id).toMatch(/^tpl_/);
    });

    it('should set subject and category to null when not provided', async () => {
      const result = await service.createTemplate(orgId, { name: 'test', channel: 'sms' as const, content: 'test' }, userId);

      expect(result.subject).toBeNull();
      expect(result.category).toBeNull();
    });

    it('should default variables to empty array when not provided', async () => {
      const result = await service.createTemplate(orgId, { name: 'test', channel: 'sms' as const, content: 'test' }, userId);

      expect(result.variables).toEqual([]);
    });

    it('should emit omnichannel.template.created event', async () => {
      const result = await service.createTemplate(orgId, dto, userId);

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'omnichannel.template.created',
        source: 'omnichannel-service',
        payload: {
          templateId: result.id,
          channel: dto.channel,
          createdBy: userId,
        },
      });
    });
  });

  describe('getChannelStatus', () => {
    it('should return all 3 channels with summary', async () => {
      const result = await service.getChannelStatus(orgId);

      expect(result.channels).toHaveLength(3);
      expect(result.summary).toEqual({ total: 3, connected: 2, disconnected: 1 });
    });

    it('should include WhatsApp channel as CONNECTED with Z-API provider', async () => {
      const result = await service.getChannelStatus(orgId);

      const whatsapp = result.channels.find(c => c.type === 'whatsapp');
      expect(whatsapp).toMatchObject({
        status: 'CONNECTED',
        provider: 'Z-API',
        config: { phoneNumber: '+5511999999999' },
      });
    });

    it('should include Email channel as CONNECTED with SendGrid provider', async () => {
      const result = await service.getChannelStatus(orgId);

      const email = result.channels.find(c => c.type === 'email');
      expect(email).toMatchObject({
        status: 'CONNECTED',
        provider: 'SendGrid',
      });
    });

    it('should include SMS channel as DISCONNECTED with Twilio provider', async () => {
      const result = await service.getChannelStatus(orgId);

      const sms = result.channels.find(c => c.type === 'sms');
      expect(sms).toMatchObject({
        status: 'DISCONNECTED',
        provider: 'Twilio',
      });
    });
  });
});
