import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ──────────────────────────────────────────────
// CREATE
// ──────────────────────────────────────────────

export class CreateEmailTemplateDto {
  @ApiProperty({ description: 'Nome do template', example: 'Boas-vindas' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Assunto do e-mail (suporta {{variaveis}})', example: 'Bem-vindo, {{nome}}!' })
  @IsString()
  subject!: string;

  @ApiProperty({ description: 'Corpo do e-mail (suporta {{variaveis}})', example: 'Olá {{nome}}, seja bem-vindo!' })
  @IsString()
  body!: string;

  @ApiPropertyOptional({ description: 'Categoria do template', example: 'onboarding' })
  @IsOptional()
  @IsString()
  category?: string;
}

// ──────────────────────────────────────────────
// UPDATE
// ──────────────────────────────────────────────

export class UpdateEmailTemplateDto {
  @ApiPropertyOptional({ description: 'Nome do template', example: 'Boas-vindas atualizado' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Assunto do e-mail', example: 'Olá, {{nome}}!' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Corpo do e-mail', example: 'Olá {{nome}}, tudo bem?' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Categoria do template', example: 'marketing' })
  @IsOptional()
  @IsString()
  category?: string;
}

// ──────────────────────────────────────────────
// SEND TEMPLATED
// ──────────────────────────────────────────────

export class SendTemplatedDto {
  @ApiProperty({ description: 'E-mail do destinatário', example: 'cliente@email.com' })
  @IsString()
  to!: string;

  @ApiProperty({ description: 'Variáveis para substituição no template', example: { nome: 'João', empresa: 'Acme' } })
  @IsObject()
  variables!: Record<string, string>;
}

// ──────────────────────────────────────────────
// SEND RAW
// ──────────────────────────────────────────────

export class SendRawDto {
  @ApiProperty({ description: 'E-mail do destinatário', example: 'cliente@email.com' })
  @IsString()
  to!: string;

  @ApiProperty({ description: 'Assunto do e-mail', example: 'Assunto do e-mail' })
  @IsString()
  subject!: string;

  @ApiProperty({ description: 'Corpo do e-mail', example: 'Conteúdo do e-mail' })
  @IsString()
  body!: string;
}

// ──────────────────────────────────────────────
// FILTERS (query params)
// ──────────────────────────────────────────────

export class EmailTemplateFiltersDto {
  @ApiPropertyOptional({ description: 'Buscar por nome', example: 'boas-vindas' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por categoria', example: 'onboarding' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Página (começa em 1)', example: 1, default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', example: 25, default: 25 })
  @IsOptional()
  perPage?: number;
}
