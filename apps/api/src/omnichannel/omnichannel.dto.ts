import { IsString, IsNumber, IsOptional, IsEmail, IsArray, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendWhatsAppDto {
  @ApiProperty({ description: 'Número do destinatário (formato internacional)', example: '+5511999999999' })
  @IsString()
  to!: string;

  @ApiProperty({ description: 'Conteúdo da mensagem', example: 'Olá, como podemos ajudar?' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ description: 'ID do template de mensagem', example: 'tpl_abc123' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'ID do contato no CRM', example: 'contact_abc123' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class SendEmailDto {
  @ApiProperty({ description: 'Endereço de email do destinatário', example: 'cliente@empresa.com' })
  @IsEmail()
  to!: string;

  @ApiProperty({ description: 'Assunto do email', example: 'Confirmação de pedido' })
  @IsString()
  subject!: string;

  @ApiProperty({ description: 'Corpo do email (texto ou HTML)', example: '<p>Seu pedido foi confirmado!</p>' })
  @IsString()
  body!: string;

  @ApiPropertyOptional({ description: 'Se o corpo é HTML', example: true })
  @IsOptional()
  isHtml?: boolean;

  @ApiPropertyOptional({ description: 'ID do template de email', example: 'tpl_email_01' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'ID do contato no CRM', example: 'contact_abc123' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Lista de IDs de anexos', example: ['file_abc123'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class SendSmsDto {
  @ApiProperty({ description: 'Número do destinatário (formato internacional)', example: '+5511999999999' })
  @IsString()
  to!: string;

  @ApiProperty({ description: 'Conteúdo do SMS (máx. 160 caracteres)', example: 'Seu código de verificação é 123456' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ description: 'ID do contato no CRM', example: 'contact_abc123' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ReplyConversationDto {
  @ApiProperty({ description: 'Conteúdo da resposta', example: 'Olá! Em que posso ajudar?' })
  @IsString()
  message!: string;

  @ApiProperty({ description: 'Canal de resposta', enum: ['whatsapp', 'email', 'sms'], example: 'whatsapp' })
  @IsEnum(['whatsapp', 'email', 'sms'])
  channel!: string;

  @ApiPropertyOptional({ description: 'ID do template utilizado', example: 'tpl_abc123' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateTemplateDto {
  @ApiProperty({ description: 'Nome do template', example: 'Boas-vindas WhatsApp' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Canal do template', enum: ['whatsapp', 'email', 'sms'], example: 'whatsapp' })
  @IsEnum(['whatsapp', 'email', 'sms'])
  channel!: string;

  @ApiProperty({ description: 'Conteúdo do template com variáveis {{var}}', example: 'Olá {{nome}}, bem-vindo!' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'Assunto (para templates de email)', example: 'Bem-vindo à nossa plataforma' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Categoria do template', example: 'onboarding' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Variáveis do template', example: ['nome', 'empresa'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];
}
