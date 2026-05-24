import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OmnichannelController } from './omnichannel.controller';

describe('OmnichannelController', () => {
  let controller: OmnichannelController;
  let omnichannelService: any;
  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    omnichannelService = {
      sendWhatsApp: vi.fn().mockResolvedValue({ messageId: 'wa-1' }),
      receiveWhatsAppWebhook: vi.fn().mockResolvedValue({ received: true }),
      sendEmail: vi.fn().mockResolvedValue({ messageId: 'email-1' }),
      sendSms: vi.fn().mockResolvedValue({ messageId: 'sms-1' }),
      getConversations: vi.fn().mockResolvedValue([]),
      getConversation: vi.fn().mockResolvedValue({ id: 'conv-1' }),
      replyConversation: vi.fn().mockResolvedValue({ messageId: 'reply-1' }),
      getTemplates: vi.fn().mockResolvedValue([]),
      createTemplate: vi.fn().mockResolvedValue({ id: 'tmpl-1' }),
      getChannelStatus: vi.fn().mockResolvedValue({ whatsapp: 'connected' }),
    };
    controller = new OmnichannelController(omnichannelService);
  });

  it('should call sendWhatsApp with organizationId, dto, and userId', async () => {
    const dto = { to: '+5511999999999', message: 'Hello' };
    const result = await controller.sendWhatsApp(req, dto);
    expect(omnichannelService.sendWhatsApp).toHaveBeenCalledWith('org-123', dto, 'user-1');
    expect(result).toEqual({ messageId: 'wa-1' });
  });

  it('should call receiveWhatsAppWebhook with organizationId and payload', async () => {
    const payload = { entry: [] };
    const result = await controller.receiveWhatsAppWebhook(req, payload);
    expect(omnichannelService.receiveWhatsAppWebhook).toHaveBeenCalledWith('org-123', payload);
    expect(result).toEqual({ received: true });
  });

  it('should call sendEmail with organizationId, dto, and userId', async () => {
    const dto = { to: 'test@example.com', subject: 'Hello', body: 'Body' };
    const result = await controller.sendEmail(req, dto);
    expect(omnichannelService.sendEmail).toHaveBeenCalledWith('org-123', dto, 'user-1');
    expect(result).toEqual({ messageId: 'email-1' });
  });

  it('should call sendSms with organizationId, dto, and userId', async () => {
    const dto = { to: '+5511999999999', message: 'SMS' };
    const result = await controller.sendSms(req, dto);
    expect(omnichannelService.sendSms).toHaveBeenCalledWith('org-123', dto, 'user-1');
    expect(result).toEqual({ messageId: 'sms-1' });
  });

  it('should call getConversations with organizationId and filters', async () => {
    const filters = { status: 'active' };
    const result = await controller.getConversations(req, filters);
    expect(omnichannelService.getConversations).toHaveBeenCalledWith('org-123', filters);
    expect(result).toEqual([]);
  });

  it('should call getConversation with organizationId and id', async () => {
    const result = await controller.getConversation(req, 'conv-1');
    expect(omnichannelService.getConversation).toHaveBeenCalledWith('org-123', 'conv-1');
    expect(result).toEqual({ id: 'conv-1' });
  });

  it('should call replyConversation with organizationId, id, dto, and userId', async () => {
    const dto = { message: 'Reply' };
    const result = await controller.replyConversation(req, 'conv-1', dto);
    expect(omnichannelService.replyConversation).toHaveBeenCalledWith('org-123', 'conv-1', dto, 'user-1');
    expect(result).toEqual({ messageId: 'reply-1' });
  });

  it('should call getTemplates with organizationId and filters', async () => {
    const filters = { category: 'marketing' };
    const result = await controller.getTemplates(req, filters);
    expect(omnichannelService.getTemplates).toHaveBeenCalledWith('org-123', filters);
    expect(result).toEqual([]);
  });

  it('should call createTemplate with organizationId, dto, and userId', async () => {
    const dto = { name: 'Promo', content: '50% off!' };
    const result = await controller.createTemplate(req, dto);
    expect(omnichannelService.createTemplate).toHaveBeenCalledWith('org-123', dto, 'user-1');
    expect(result).toEqual({ id: 'tmpl-1' });
  });

  it('should call getChannelStatus with organizationId', async () => {
    const result = await controller.getChannelStatus(req);
    expect(omnichannelService.getChannelStatus).toHaveBeenCalledWith('org-123');
    expect(result).toEqual({ whatsapp: 'connected' });
  });
});
