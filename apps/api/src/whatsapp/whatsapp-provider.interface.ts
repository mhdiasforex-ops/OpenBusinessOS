import { WhatsAppProviderName, WhatsAppMessageDirection, WhatsAppMessageStatus, WhatsAppTemplateStatus } from './whatsapp.dto';

// ── Provider Interface ────────────────────────────────────────────────

export interface WhatsAppProvider {
  readonly name: WhatsAppProviderName;

  // Instance management
  createInstance(instanceName: string, config: Record<string, any>): Promise<{ instanceId: string; qrCode?: string; status: string }>;
  connectInstance(instanceId: string): Promise<{ status: string; qrCode?: string }>;
  disconnectInstance(instanceId: string): Promise<void>;
  getInstanceStatus(instanceId: string): Promise<{ status: string; phone?: string }>;
  deleteInstance(instanceId: string): Promise<void>;

  // Messages
  sendText(instanceId: string, phone: string, text: string): Promise<SendMessageResult>;
  sendTemplate(instanceId: string, phone: string, templateName: string, language: string, components: any[]): Promise<SendMessageResult>;
  sendMedia(instanceId: string, phone: string, type: 'image' | 'document' | 'audio' | 'video', url: string, caption?: string): Promise<SendMessageResult>;

  // Templates
  createTemplate(businessId: string, template: CreateTemplateInput): Promise<{ externalId: string; status: WhatsAppTemplateStatus }>;
  getTemplates(businessId: string): Promise<ExternalTemplate[]>;
  deleteTemplate(businessId: string, templateName: string): Promise<void>;

  // Webhook
  processWebhook(payload: any, signature?: string): Promise<WebhookProcessedResult>;
}

// ── Shared Types ──────────────────────────────────────────────────────

export interface SendMessageResult {
  externalId: string;
  status: WhatsAppMessageStatus;
  timestamp?: Date;
}

export interface CreateTemplateInput {
  name: string;
  category: string;
  language: string;
  body: string;
  header?: string;
  footer?: string;
  buttons?: Record<string, any>[];
}

export interface ExternalTemplate {
  externalId: string;
  name: string;
  category: string;
  language: string;
  status: WhatsAppTemplateStatus;
  body?: string;
  header?: string;
  footer?: string;
  buttons?: Record<string, any>[];
}

export interface WebhookProcessedResult {
  externalId?: string;
  phone?: string;
  direction: WhatsAppMessageDirection;
  status?: WhatsAppMessageStatus;
  content?: string;
  timestamp?: Date;
  eventType?: string;
}
