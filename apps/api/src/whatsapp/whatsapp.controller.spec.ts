import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsAppController } from './whatsapp.controller';

describe('WhatsAppController', () => {
  let controller: WhatsAppController;
  let service: any;

  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    service = {
      findAll: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      findOne: vi.fn().mockResolvedValue({ id: 'conv-1' }),
      sendMessage: vi.fn().mockResolvedValue({ id: 'msg-1' }),
      createTemplate: vi.fn().mockResolvedValue({ id: 'tpl-1' }),
      getTemplates: vi.fn().mockResolvedValue({ items: [] }),
      handleWebhook: vi.fn().mockResolvedValue({ status: 'received' }),
      getStats: vi.fn().mockResolvedValue({ total: 100 }),
    };
    controller = new WhatsAppController(service);
  });

  it('should list conversations', async () => {
    const result = await controller.findAll(req, '1', '20');
    expect(result).toEqual({ items: [], total: 0 });
    expect(service.findAll).toHaveBeenCalledWith('org-123', 1, 20);
  });

  it('should get conversation with messages', async () => {
    const result = await controller.findOne(req, 'conv-1');
    expect(result).toEqual({ id: 'conv-1' });
    expect(service.findOne).toHaveBeenCalledWith('org-123', 'conv-1');
  });

  it('should send message', async () => {
    const dto = { text: 'Hello' } as any;
    const result = await controller.sendMessage(req, 'conv-1', dto);
    expect(result).toEqual({ id: 'msg-1' });
    expect(service.sendMessage).toHaveBeenCalledWith('org-123', 'conv-1', 'Hello');
  });

  it('should create template', async () => {
    const dto = { name: 'welcome', content: 'Hi', category: 'MARKETING' } as any;
    const result = await controller.createTemplate(req, dto);
    expect(result).toEqual({ id: 'tpl-1' });
    expect(service.createTemplate).toHaveBeenCalledWith('org-123', dto);
  });

  it('should list templates', async () => {
    const result = await controller.getTemplates(req);
    expect(result).toEqual({ items: [] });
    expect(service.getTemplates).toHaveBeenCalledWith('org-123');
  });

  it('should handle webhook', async () => {
    const payload = { from: '+5511999999999', message: 'Oi' } as any;
    const result = await controller.handleWebhook(payload);
    expect(result).toEqual({ status: 'received' });
    expect(service.handleWebhook).toHaveBeenCalledWith(payload);
  });

  it('should get stats', async () => {
    const result = await controller.getStats(req);
    expect(result).toEqual({ total: 100 });
    expect(service.getStats).toHaveBeenCalledWith('org-123');
  });
});
