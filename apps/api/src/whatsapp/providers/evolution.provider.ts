import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppProviderName, WhatsAppMessageStatus, WhatsAppTemplateStatus, WhatsAppMessageDirection } from '../whatsapp.dto';
import {
  WhatsAppProvider,
  SendMessageResult,
  CreateTemplateInput,
  ExternalTemplate,
  WebhookProcessedResult,
} from '../whatsapp-provider.interface';

@Injectable()
export class EvolutionProvider implements WhatsAppProvider {
  readonly name = WhatsAppProviderName.EVOLUTION_API;
  private readonly logger = new Logger(EvolutionProvider.name);

  // ── Instance ──────────────────────────────────────────────────────

  async createInstance(instanceName: string, config: Record<string, any>) {
    // TODO: call POST /instance/create on Evolution API
    this.logger.log(`Evolution: create instance ${instanceName}`);
    return {
      instanceId: instanceName,
      qrCode: undefined,
      status: 'disconnected',
    };
  }

  async connectInstance(instanceId: string) {
    this.logger.log(`Evolution: connect ${instanceId}`);
    // TODO: call GET /instance/connect/{instanceId}
    return {
      status: 'connecting',
      qrCode: 'base64qr...',
    };
  }

  async disconnectInstance(instanceId: string) {
    this.logger.log(`Evolution: disconnect ${instanceId}`);
    // TODO: call DELETE /instance/logout/{instanceId}
  }

  async getInstanceStatus(instanceId: string) {
    this.logger.log(`Evolution: status ${instanceId}`);
    return { status: 'connected' };
  }

  async deleteInstance(instanceId: string) {
    this.logger.log(`Evolution: delete ${instanceId}`);
    // TODO: call DELETE /instance/delete/{instanceId}
  }

  // ── Messages ──────────────────────────────────────────────────────

  async sendText(instanceId: string, phone: string, text: string): Promise<SendMessageResult> {
    // TODO: call POST /message/sendText/{instanceId}
    this.logger.log(`Evolution: send text to ${phone} via ${instanceId}`);
    return {
      externalId: `evo_${Date.now()}`,
      status: WhatsAppMessageStatus.SENT,
      timestamp: new Date(),
    };
  }

  async sendTemplate(
    instanceId: string,
    phone: string,
    templateName: string,
    language: string,
    components: any[],
  ): Promise<SendMessageResult> {
    // Evolution doesn't natively support templates like Meta;
    // typically you resolve the template body and send as text
    this.logger.log(`Evolution: send template ${templateName} to ${phone}`);
    return {
      externalId: `evo_tpl_${Date.now()}`,
      status: WhatsAppMessageStatus.SENT,
      timestamp: new Date(),
    };
  }

  async sendMedia(
    instanceId: string,
    phone: string,
    type: 'image' | 'document' | 'audio' | 'video',
    url: string,
    caption?: string,
  ): Promise<SendMessageResult> {
    this.logger.log(`Evolution: send ${type} to ${phone}`);
    return {
      externalId: `evo_media_${Date.now()}`,
      status: WhatsAppMessageStatus.SENT,
      timestamp: new Date(),
    };
  }

  // ── Templates ─────────────────────────────────────────────────────

  async createTemplate(businessId: string, input: CreateTemplateInput) {
    // Evolution doesn't have template CRUD — store locally only
    this.logger.warn('Evolution: template management not supported natively');
    return {
      externalId: `local_tpl_${Date.now()}`,
      status: WhatsAppTemplateStatus.APPROVED,
    };
  }

  async getTemplates(businessId: string): Promise<ExternalTemplate[]> {
    return [];
  }

  async deleteTemplate(businessId: string, templateName: string) {
    this.logger.warn('Evolution: template delete not supported');
  }

  // ── Webhook ───────────────────────────────────────────────────────

  async processWebhook(payload: any, signature?: string): Promise<WebhookProcessedResult> {
    // Evolution API webhook format
    const event = payload?.event;
    const data = payload?.data;

    if (event === 'messages.upsert' && data) {
      const key = data.key || {};
      const msg = data.message || {};
      const isFromMe = key.fromMe === true;

      return {
        externalId: key.id,
        phone: key.remoteJid?.replace('@s.whatsapp.net', ''),
        direction: isFromMe ? WhatsAppMessageDirection.OUTBOUND : WhatsAppMessageDirection.INBOUND,
        status: isFromMe ? WhatsAppMessageStatus.SENT : WhatsAppMessageStatus.DELIVERED,
        content: msg.conversation || msg.extendedTextMessage?.text || '',
        timestamp: data.messageTimestamp ? new Date(parseInt(data.messageTimestamp, 10) * 1000) : new Date(),
      };
    }

    if (event === 'messages.upsert' && data?.status) {
      const statusMap: Record<string, WhatsAppMessageStatus> = {
        2: WhatsAppMessageStatus.SENT,
        3: WhatsAppMessageStatus.DELIVERED,
        4: WhatsAppMessageStatus.READ,
        5: WhatsAppMessageStatus.FAILED,
      };
      return {
        externalId: data.key?.id,
        phone: data.key?.remoteJid?.replace('@s.whatsapp.net', ''),
        direction: WhatsAppMessageDirection.OUTBOUND,
        status: statusMap[data.status] || WhatsAppMessageStatus.QUEUED,
        eventType: 'status_update',
      };
    }

    return {
      direction: WhatsAppMessageDirection.INBOUND,
      eventType: event || 'unknown',
    };
  }
}
