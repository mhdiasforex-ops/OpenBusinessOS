import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
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

// ── Config DTOs ────────────────────────────────────────────────────────

export class CreateWhatsAppConfigDto {
  @ApiProperty({ enum: WhatsAppProviderName, description: 'Provedor WhatsApp' })
  @IsEnum(WhatsAppProviderName)
  provider!: WhatsAppProviderName;

  @ApiPropertyOptional({ description: 'Se a configuração está ativa' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Nome da instância (Evolution API)' })
  @IsOptional()
  @IsString()
  instanceName?: string;

  @ApiPropertyOptional({ description: 'Chave de API do provedor' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'URL da API do provedor' })
  @IsOptional()
  @IsString()
  apiUrl?: string;

  @ApiPropertyOptional({ description: 'Número de telefone' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Business ID (Meta Cloud API)' })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({ description: 'URL do webhook' })
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'Secret do webhook' })
  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @ApiPropertyOptional({ description: 'Configurações adicionais (JSON)' })
  @IsOptional()
  settings?: Record<string, any>;
}

export class UpdateWhatsAppConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instanceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  settings?: Record<string, any>;
}

// ── Template DTOs ──────────────────────────────────────────────────────

export class CreateWhatsAppTemplateDto {
  @ApiProperty({ description: 'ID da configuração WhatsApp' })
  @IsString()
  configId!: string;

  @ApiProperty({ description: 'Nome do template' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Categoria do template' })
  @IsString()
  category!: string;

  @ApiPropertyOptional({ description: 'Idioma do template', default: 'pt_BR' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ description: 'Corpo do template' })
  @IsString()
  body!: string;

  @ApiPropertyOptional({ description: 'Cabeçalho do template' })
  @IsOptional()
  @IsString()
  header?: string;

  @ApiPropertyOptional({ description: 'Rodapé do template' })
  @IsOptional()
  @IsString()
  footer?: string;

  @ApiPropertyOptional({ description: 'Botões do template (JSON)' })
  @IsOptional()
  buttons?: Record<string, any>[];

  @ApiPropertyOptional({ enum: WhatsAppTemplateStatus })
  @IsOptional()
  @IsEnum(WhatsAppTemplateStatus)
  status?: WhatsAppTemplateStatus;

  @ApiPropertyOptional({ description: 'ID externo no provedor' })
  @IsOptional()
  @IsString()
  externalId?: string;
}

export class UpdateWhatsAppTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  configId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  header?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  footer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  buttons?: Record<string, any>[];

  @ApiPropertyOptional({ enum: WhatsAppTemplateStatus })
  @IsOptional()
  @IsEnum(WhatsAppTemplateStatus)
  status?: WhatsAppTemplateStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalId?: string;
}

// ── Message DTOs ───────────────────────────────────────────────────────

export class SendMessageDto {
  @ApiProperty({ description: 'ID da configuração WhatsApp' })
  @IsString()
  configId!: string;

  @ApiPropertyOptional({ description: 'ID do template (mensagem template)' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ description: 'Número de telefone destino' })
  @IsString()
  phone!: string;

  @ApiProperty({ description: 'Conteúdo da mensagem' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais (JSON)' })
  @IsOptional()
  metadata?: Record<string, any>;
}

// ── Filter DTOs ────────────────────────────────────────────────────────

export class MessageFiltersDto {
  @ApiPropertyOptional({ description: 'Filtrar por status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filtrar por direção' })
  @IsOptional()
  @IsString()
  direction?: string;

  @ApiPropertyOptional({ description: 'Filtrar por telefone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Filtrar por configId' })
  @IsOptional()
  @IsString()
  configId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por templateId' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por customerId' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Data inicial (ISO)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final (ISO)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', default: 50 })
  @IsOptional()
  @Type(() => Number)
  perPage?: number;
}

export class TemplateFiltersDto {
  @ApiPropertyOptional({ description: 'Filtrar por status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filtrar por configId' })
  @IsOptional()
  @IsString()
  configId?: string;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', default: 50 })
  @IsOptional()
  @Type(() => Number)
  perPage?: number;
}

export class ConfigFiltersDto {
  @ApiPropertyOptional({ description: 'Filtrar por provider' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'Filtrar por isActive' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', default: 50 })
  @IsOptional()
  @Type(() => Number)
  perPage?: number;
}
