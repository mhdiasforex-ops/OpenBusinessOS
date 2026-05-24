import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EvolutionProvider } from './evolution.provider';
import { WhatsAppMessageStatus, WhatsAppMessageDirection, WhatsAppTemplateStatus } from '../whatsapp.dto';

vi.mock('axios');

describe('EvolutionProvider', () => {
  let provider: EvolutionProvider;

  beforeEach(() => {
    provider = new EvolutionProvider();
  });

  describe('sendText', () => {
    it('should send text message and return result', async () => {
      const result = await provider.sendText('instance-1', '5511999999999', 'Hello');
      expect(result.externalId).toMatch(/^evo_/);
      expect(result.status).toBe(WhatsAppMessageStatus.SENT);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('sendMedia', () => {
    it('should send image media', async () => {
      const result = await provider.sendMedia('instance-1', '5511999999999', 'image', 'http://example.com/img.jpg');
      expect(result.externalId).toMatch(/^evo_media_/);
      expect(result.status).toBe(WhatsAppMessageStatus.SENT);
    });

    it('should send document media', async () => {
      const result = await provider.sendMedia('instance-1', '5511999999999', 'document', 'http://example.com/doc.pdf', 'My doc');
      expect(result.externalId).toMatch(/^evo_media_/);
      expect(result.status).toBe(WhatsAppMessageStatus.SENT);
    });
  });

  describe('sendTemplate', () => {
    it('should send template as text and return result', async () => {
      const result = await provider.sendTemplate('instance-1', '5511999999999', 'welcome', 'pt_BR', []);
      expect(result.externalId).toMatch(/^evo_tpl_/);
      expect(result.status).toBe(WhatsAppMessageStatus.SENT);
    });
  });

  describe('createInstance', () => {
    it('should create instance and return disconnected status', async () => {
      const result = await provider.createInstance('my-instance', {});
      expect(result.instanceId).toBe('my-instance');
      expect(result.status).toBe('disconnected');
    });
  });

  describe('connectInstance', () => {
    it('should return connecting status with QR code', async () => {
      const result = await provider.connectInstance('instance-1');
      expect(result.status).toBe('connecting');
      expect(result.qrCode).toBeDefined();
    });
  });

  describe('processWebhook', () => {
    it('should process messages.upsert with inbound message', async () => {
      const payload = {
        event: 'messages.upsert',
        data: {
          key: { id: 'evo-msg-1', remoteJid: '5511999999999@s.whatsapp.net', fromMe: false },
          message: { conversation: 'Hello!' },
          messageTimestamp: '1680000000',
        },
      };
      const result = await provider.processWebhook(payload);
      expect(result.externalId).toBe('evo-msg-1');
      expect(result.phone).toBe('5511999999999');
      expect(result.direction).toBe(WhatsAppMessageDirection.INBOUND);
      expect(result.content).toBe('Hello!');
    });

    it('should process outbound messages from self', async () => {
      const payload = {
        event: 'messages.upsert',
        data: {
          key: { id: 'evo-msg-2', remoteJid: '5511999999999@s.whatsapp.net', fromMe: true },
          message: { conversation: 'Sent!' },
          messageTimestamp: '1680000001',
        },
      };
      const result = await provider.processWebhook(payload);
      expect(result.direction).toBe(WhatsAppMessageDirection.OUTBOUND);
      expect(result.status).toBe(WhatsAppMessageStatus.SENT);
    });

    it('should process status update messages (first branch)', async () => {
      const payload = {
        event: 'messages.upsert',
        data: {
          key: { id: 'evo-status-1', remoteJid: '5511999999999@s.whatsapp.net', fromMe: true },
          status: '3',
        },
      };
      const result = await provider.processWebhook(payload);
      expect(result.direction).toBe(WhatsAppMessageDirection.OUTBOUND);
      expect(result.status).toBe(WhatsAppMessageStatus.SENT);
    });

    it('should handle unknown events', async () => {
      const payload = { event: 'unknown.event' };
      const result = await provider.processWebhook(payload);
      expect(result.direction).toBe(WhatsAppMessageDirection.INBOUND);
      expect(result.eventType).toBe('unknown.event');
    });
  });

  describe('getTemplates', () => {
    it('should return empty array', async () => {
      const result = await provider.getTemplates('biz-1');
      expect(result).toEqual([]);
    });
  });

  describe('createTemplate', () => {
    it('should return local template with approved status', async () => {
      const result = await provider.createTemplate('biz-1', { name: 'tpl', category: 'UTILITY', language: 'pt_BR', body: 'Hello {{1}}' });
      expect(result.externalId).toMatch(/^local_tpl_/);
      expect(result.status).toBe(WhatsAppTemplateStatus.APPROVED);
    });
  });
});
