import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Enums ──────────────────────────────────────────────────────────────

export enum WhatsAppProviderName {
  META_CLOUD_API = 'META_CLOUD_API',
  EVOLUTION_API = 'EVOLUTION_API',
  TWILIO = 'TWILIO',
  ZENVIA = 'ZENVIA',
  WATI = 'WATI',
}

export enum WhatsAppTemplateStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISABLED = 'DISABLED',
}

export enum WhatsAppMessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum WhatsAppMessageStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum TemplateCategory {
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
  AUTHENTICATION = 'AUTHENTICATION',
}

// ── Conversation DTOs ──────────────────────────────────────────────────

export class SendMessageDto {
  @ApiProperty({ description: 'Text message to send' })
  @IsString()
  text!: string;
}

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Template content/body' })
  @IsString()
  content!: string;

  @ApiProperty({ enum: TemplateCategory, description: 'Template category' })
  @IsEnum(TemplateCategory)
  category!: TemplateCategory;
}

export class WebhookDto {
  @ApiProperty({ description: 'Sender phone number' })
  @IsString()
  from!: string;

  @ApiProperty({ description: 'Incoming message text' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ description: 'Message timestamp (ISO)' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
