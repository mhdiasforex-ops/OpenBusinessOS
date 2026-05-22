import { IsString, IsEmail, IsOptional, IsEnum, IsArray, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Nome do cliente', example: 'Maria Santos' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Email do cliente', example: 'maria@email.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'Telefone do cliente', example: '(11) 99999-0000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'CPF/CNPJ do cliente', example: '123.456.789-00' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({
    description: 'Segmento do cliente',
    enum: ['VIP', 'REGULAR', 'NEW', 'AT_RISK', 'CHURNED'],
    example: 'REGULAR',
  })
  @IsOptional()
  @IsEnum(['VIP', 'REGULAR', 'NEW', 'AT_RISK', 'CHURNED'])
  segment?: string;

  @ApiPropertyOptional({ description: 'Tags do cliente', type: [String], example: ['premium', 'recorrente'] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Metadados adicionais', example: { fonte: 'indicacao' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ description: 'Nome do cliente', example: 'Maria Santos Silva' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Email do cliente', example: 'maria.nova@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone do cliente', example: '(11) 98888-0000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'CPF/CNPJ do cliente', example: '123.456.789-00' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({
    description: 'Segmento do cliente',
    enum: ['VIP', 'REGULAR', 'NEW', 'AT_RISK', 'CHURNED'],
    example: 'VIP',
  })
  @IsOptional()
  @IsEnum(['VIP', 'REGULAR', 'NEW', 'AT_RISK', 'CHURNED'])
  segment?: string;

  @ApiPropertyOptional({ description: 'Tags do cliente', type: [String], example: ['premium'] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Metadados adicionais', example: { fonte: 'site' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateCampaignDto {
  @ApiProperty({ description: 'Nome da campanha', example: 'Black Friday 2026' })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Canal de envio',
    enum: ['EMAIL', 'WHATSAPP', 'SMS'],
    example: 'EMAIL',
  })
  @IsString()
  channel!: string;

  @ApiPropertyOptional({
    description: 'Segmento alvo',
    enum: ['ALL', 'VIP', 'REGULAR', 'NEW', 'AT_RISK', 'CHURNED'],
    example: 'ALL',
  })
  @IsOptional()
  @IsString()
  segment?: string;

  @ApiPropertyOptional({ description: 'Número estimado de destinatários', example: 500 })
  @IsOptional()
  @IsNumber()
  recipientCount?: number;

  @ApiPropertyOptional({ description: 'Mensagem da campanha', example: 'Aproveite até 50% de desconto!' })
  @IsOptional()
  @IsString()
  message?: string;
}
