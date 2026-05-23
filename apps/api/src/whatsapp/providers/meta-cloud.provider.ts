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
export class MetaCloudProvider implements WhatsAppProvider {
  readonly name = WhatsAppProviderName.META_CLOUD_API;
  private readonly logger = new Logger(MetaCloudProvider.name);

  // ── Instance ──────────────────────────────────────────────────────

  async createInstance(instanceName: string, config: Record<string, any>) {
    // Meta Cloud API doesn't use "instances" like Evolution —
    // the phone number ID + business ID act as the instance
    this.logger.log(`MetaCloud: register phone ${instanceName}`);
    return {
      instanceId: config.phoneNumberId || instanceName,
      status: 'connected',
    };
  }

  async connectInstance(instanceId: string) {
    this.logger.log(`MetaCloud: connect ${instanceId}`);
    return { status: 'connected' };
  }

  async disconnectInstance(instanceId: string) {
    this.logger.log(`MetaCloud: disconnect ${instanceId}`);
  }

  async getInstanceStatus(instanceId: string) {
    return { status: 'connected', phone: instanceId };
  }

  async deleteInstance(instanceId: string) {
    this.logger.log(`MetaCloud: delete instance ${instanceId}`);
  }

  // ── Messages ──────────────────────────────────────────────────────

  async sendText(instanceId: string, phone: string, text: string): Promise<SendMessageResult> {
    // TODO: call POST /v18.0/{phone_number_id}/messages
    this.logger.log(`MetaCloud: send text to ${phone}`);
    return {
      externalId: `meta_${Date.now()}`,
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
    this.logger.log(`MetaCloud: send template ${templateName} to ${phone}`);
    return {
      externalId: `meta_tpl_${Date.now()}`,
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
    this.logger.log(`MetaCloud: send ${type} to ${phone}`);
    return {
      externalId: `meta_media_${Date.now()}`,
      status: WhatsAppMessageStatus.SENT,
      timestamp: new Date(),
    };
  }

  // ── Templates ─────────────────────────────────────────────────────

  async createTemplate(businessId: string, input: CreateTemplateInput) {
    this.logger.log(`MetaCloud: create template ${input.name} for business ${businessId}`);
    return {
      externalId: `tpl_${Date.now()}`,
      status: WhatsAppTemplateStatus.PENDING,
    };
  }

  async getTemplates(businessId: string): Promise<ExternalTemplate[]> {
    this.logger.log(`MetaCloud: get templates for business ${businessId}`);
    return [];
  }

  async deleteTemplate(businessId: string, templateName: string) {
    this.logger.log(`MetaCloud: delete template ${templateName}`);
  }

  // ── Webhook ───────────────────────────────────────────────────────

  async processWebhook(payload: any, signature?: string): Promise<WebhookProcessedResult> {
    // Meta Cloud API sends webhook with entry[].changes[].value
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    const status = value?.statuses?.[0];

    if (message) {
      return {
        externalId: message.id,
        phone: message.from,
        direction: WhatsAppMessageDirection.INBOUND,
        status: WhatsAppMessageStatus.DELIVERED,
        content: message.text?.body || message.interactive?.body || '',
        timestamp: new Date(parseInt(message.timestamp, 10) * 1000),
      };
    }

    if (status) {
      const statusMap: Record<string, WhatsAppMessageStatus> = {
        sent: WhatsAppMessageStatus.SENT,
        delivered: WhatsAppMessageStatus.DELIVERED,
        read: WhatsAppMessageStatus.READ,
        failed: WhatsAppMessageStatus.FAILED,
      };
      return {
        externalId: status.id,
        phone: status.recipient_id,
        direction: WhatsAppMessageDirection.OUTBOUND,
        status: statusMap[status.status] || WhatsAppMessageStatus.QUEUED,
        timestamp: new Date(parseInt(status.timestamp, 10) * 1000),
        eventType: 'status_update',
      };
    }

    return {
      direction: WhatsAppMessageDirection.INBOUND,
      eventType: 'unknown',
    };
  }
}
