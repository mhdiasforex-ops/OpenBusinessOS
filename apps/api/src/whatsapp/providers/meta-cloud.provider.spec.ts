import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetaCloudProvider } from './meta-cloud.provider';
import { WhatsAppMessageStatus, WhatsAppMessageDirection, WhatsAppTemplateStatus } from '../whatsapp.dto';

vi.mock('axios');

describe('MetaCloudProvider', () => {
  let provider: MetaCloudProvider;

  beforeEach(() => {
    provider = new MetaCloudProvider();
  });

  describe('sendText', () => {
    it('should send text message and return result', async () => {
      const result = await provider.sendText('phone-id-1', '5511999999999', 'Hello');
      expect(result.externalId).toMatch(/^meta_/);
      expect(result.status).toBe(WhatsAppMessageStatus.SENT);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('sendMedia', () => {
    it('should send image media', async () => {
      const result = await provider.sendMedia('phone-id-1', '5511999999999', 'image', 'http://example.com/img.jpg');
      expect(result.externalId).toMatch(/^meta_media_/);
      expect(result.status).toBe(WhatsAppMessageStatus.SENT);
    });

    it('should send audio media', async () => {
      const result = await provider.sendMedia('phone-id-1', '5511999999999', 'audio', 'http://example.com/audio.mp3');
      expect(result.externalId).toMatch(/^meta_media_/);
      expect(result.status).toBe(WhatsAppMessageStatus.SENT);
    });
  });

  describe('sendTemplate', () => {
    it('should send template message', async () => {
      const result = await provider.sendTemplate('phone-id-1', '5511999999999', 'welcome', 'pt_BR', [{ type: 'body', parameters: [{ type: 'text', text: 'João' }] }]);
      expect(result.externalId).toMatch(/^meta_tpl_/);
      expect(result.status).toBe(WhatsAppMessageStatus.SENT);
    });
  });

  describe('createInstance', () => {
    it('should register phone and return connected status', async () => {
      const result = await provider.createInstance('my-phone', { phoneNumberId: 'phone-id-1' });
      expect(result.instanceId).toBe('phone-id-1');
      expect(result.status).toBe('connected');
    });

    it('should use instanceName when phoneNumberId is missing', async () => {
      const result = await provider.createInstance('my-phone', {});
      expect(result.instanceId).toBe('my-phone');
    });
  });

  describe('processWebhook', () => {
    it('should process inbound message', async () => {
      const payload = {
        entry: [{
          changes: [{
            value: {
              messages: [{
                id: 'whatsapp-msg-1',
                from: '5511999999999',
                text: { body: 'Olá!' },
                timestamp: '1680000000',
              }],
            },
          }],
        }],
      };
      const result = await provider.processWebhook(payload);
      expect(result.externalId).toBe('whatsapp-msg-1');
      expect(result.phone).toBe('5511999999999');
      expect(result.direction).toBe(WhatsAppMessageDirection.INBOUND);
      expect(result.status).toBe(WhatsAppMessageStatus.DELIVERED);
      expect(result.content).toBe('Olá!');
    });

    it('should process status update', async () => {
      const payload = {
        entry: [{
          changes: [{
            value: {
              statuses: [{
                id: 'whatsapp-status-1',
                recipient_id: '5511999999999',
                status: 'delivered',
                timestamp: '1680000001',
              }],
            },
          }],
        }],
      };
      const result = await provider.processWebhook(payload);
      expect(result.externalId).toBe('whatsapp-status-1');
      expect(result.phone).toBe('5511999999999');
      expect(result.direction).toBe(WhatsAppMessageDirection.OUTBOUND);
      expect(result.status).toBe(WhatsAppMessageStatus.DELIVERED);
      expect(result.eventType).toBe('status_update');
    });

    it('should handle unknown webhook payload', async () => {
      const payload = {};
      const result = await provider.processWebhook(payload);
      expect(result.direction).toBe(WhatsAppMessageDirection.INBOUND);
      expect(result.eventType).toBe('unknown');
    });
  });

  describe('createTemplate', () => {
    it('should return pending template', async () => {
      const result = await provider.createTemplate('biz-1', { name: 'tpl', category: 'UTILITY', language: 'pt_BR', body: 'Hello' });
      expect(result.externalId).toMatch(/^tpl_/);
      expect(result.status).toBe(WhatsAppTemplateStatus.PENDING);
    });
  });
});
