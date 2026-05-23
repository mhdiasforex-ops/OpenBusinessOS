import { IsString, IsOptional, IsEnum, IsNumber, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const ContractTypeValues = ['SERVICE', 'SUPPLY', 'RENT', 'EMPLOYMENT', 'OTHER'] as const;
export const ContractStatusValues = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED'] as const;

export class CreateContractDto {
  @ApiProperty({ description: 'Título do contrato', example: 'Contrato de Prestação de Serviços' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Descrição do contrato', example: 'Contrato para serviços de consultoria' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Tipo do contrato',
    enum: ContractTypeValues,
    example: 'SERVICE',
  })
  @IsOptional()
  @IsEnum(ContractTypeValues)
  type?: string;

  @ApiPropertyOptional({ description: 'ID do fornecedor vinculado', example: 'clx123abc' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'ID do cliente vinculado', example: 'clx456def' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Valor do contrato', example: 15000.0 })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ description: 'Data de início (ISO 8601)', example: '2026-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de término (ISO 8601)', example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais', example: { numeroContrato: 'CT-2026-001' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateContractDto {
  @ApiPropertyOptional({ description: 'Título do contrato', example: 'Contrato Atualizado' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Descrição do contrato' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Tipo do contrato',
    enum: ContractTypeValues,
    example: 'SUPPLY',
  })
  @IsOptional()
  @IsEnum(ContractTypeValues)
  type?: string;

  @ApiPropertyOptional({
    description: 'Status do contrato',
    enum: ContractStatusValues,
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(ContractStatusValues)
  status?: string;

  @ApiPropertyOptional({ description: 'ID do fornecedor vinculado' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'ID do cliente vinculado' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Valor do contrato', example: 20000.0 })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ description: 'Data de início (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de término (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
