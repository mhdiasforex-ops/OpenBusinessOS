import { IsString, IsEmail, IsOptional, IsBoolean, IsObject, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ──────────────────────────────────────────────
// Create
// ──────────────────────────────────────────────

export class CreateSupplierDto {
  @ApiProperty({ description: 'Nome do fornecedor', example: 'Distribuidora ABC Ltda' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'E-mail do fornecedor', example: 'contato@distribuidoraabc.com' })
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone do fornecedor', example: '(11) 3333-4444' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    description: 'CNPJ do fornecedor (somente números ou formato com pontuação)',
    example: '12.345.678/0001-90',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14})$/, {
    message: 'CNPJ inválido. Use o formato 00.000.000/0000-00 ou somente números',
  })
  document?: string;

  @ApiPropertyOptional({
    description: 'Endereço completo do fornecedor',
    example: {
      street: 'Rua das Indústrias, 500',
      city: 'São Paulo',
      state: 'SP',
      zip: '04567-890',
      country: 'Brasil',
    },
  })
  @IsOptional()
  @IsObject()
  address?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Observações sobre o fornecedor', example: 'Entrega em 48h, pagamento 30d' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Se o fornecedor está ativo', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ──────────────────────────────────────────────
// Update
// ──────────────────────────────────────────────

export class UpdateSupplierDto {
  @ApiPropertyOptional({ description: 'Nome do fornecedor', example: 'Distribuidora ABC S.A.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'E-mail do fornecedor', example: 'novo@distribuidoraabc.com' })
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone do fornecedor', example: '(11) 3333-5555' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    description: 'CNPJ do fornecedor',
    example: '98.765.432/0001-10',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14})$/, {
    message: 'CNPJ inválido. Use o formato 00.000.000/0000-00 ou somente números',
  })
  document?: string;

  @ApiPropertyOptional({
    description: 'Endereço completo do fornecedor',
    example: { street: 'Av. Paulista, 1000', city: 'São Paulo', state: 'SP', zip: '01310-100' },
  })
  @IsOptional()
  @IsObject()
  address?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Observações sobre o fornecedor', example: 'Atualizado: pagamento em 60d' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Se o fornecedor está ativo', example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ──────────────────────────────────────────────
// Filters (query params)
// ──────────────────────────────────────────────

export class SupplierFiltersDto {
  @ApiPropertyOptional({ description: 'Buscar por nome, e-mail ou CNPJ', example: 'Distribuidora' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por status ativo/inativo', example: 'true', enum: ['true', 'false'] })
  @IsOptional()
  isActive?: string;

  @ApiPropertyOptional({ description: 'Página (começa em 1)', example: 1, default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', example: 25, default: 25 })
  @IsOptional()
  perPage?: number;
}
