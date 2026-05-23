import { IsString, IsOptional, IsEnum, IsInt, Min, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const NICHE_VALUES = ['RETAIL', 'ECOMMERCE', 'FOOD_SERVICE', 'PROFESSIONAL_SERVICES', 'HEALTH_CARE', 'EDUCATION', 'CONSTRUCTION', 'BEAUTY', 'FITNESS', 'LEGAL', 'ACCOUNTING', 'TECH_SERVICES', 'REAL_ESTATE', 'AUTOMOTIVE', 'AGRICULTURE', 'OTHER'] as const;
const CMS_STATUS_VALUES = ['DRAFT', 'PUBLISHED'] as const;
const CMS_BLOCK_TYPE_VALUES = ['HERO', 'FEATURE', 'STAT', 'TESTIMONIAL', 'FAQ', 'CTA', 'PRICING', 'COMPARISON', 'GALLERY'] as const;

// --- CMS Page DTOs ---

export class CreateCmsPageDto {
  @ApiProperty({ description: 'Slug único da página', example: 'varejo-landing' })
  @IsString()
  slug!: string;

  @ApiProperty({ description: 'Título da página', example: 'BusinessOS para Varejo' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Nicho da página', enum: NICHE_VALUES, example: 'RETAIL' })
  @IsOptional()
  @IsString()
  niche?: string;

  @ApiPropertyOptional({ description: 'Conteúdo estruturado (JSON)', example: { sections: [] } })
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Metadados (SEO etc)', example: { description: 'Página do varejo' } })
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Status da página', enum: CMS_STATUS_VALUES, example: 'DRAFT' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateCmsPageDto {
  @ApiPropertyOptional({ description: 'Título da página' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Conteúdo estruturado (JSON)' })
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Metadados' })
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Status', enum: CMS_STATUS_VALUES })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Nicho', enum: NICHE_VALUES })
  @IsOptional()
  @IsString()
  niche?: string;
}

// --- CMS Block DTOs ---

export class CreateCmsBlockDto {
  @ApiProperty({ description: 'Chave única do bloco', example: 'varejo-hero' })
  @IsString()
  key!: string;

  @ApiPropertyOptional({ description: 'Nicho do bloco', enum: NICHE_VALUES, example: 'RETAIL' })
  @IsOptional()
  @IsString()
  niche?: string;

  @ApiProperty({ description: 'Tipo do bloco', enum: CMS_BLOCK_TYPE_VALUES, example: 'HERO' })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ description: 'Conteúdo estruturado (JSON)', example: { title: 'Varejo', subtitle: 'Gestão completa' } })
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Ordem de exibição', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ description: 'Status', enum: CMS_STATUS_VALUES, example: 'DRAFT' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateCmsBlockDto {
  @ApiPropertyOptional({ description: 'Chave do bloco' })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional({ description: 'Nicho', enum: NICHE_VALUES })
  @IsOptional()
  @IsString()
  niche?: string;

  @ApiPropertyOptional({ description: 'Tipo', enum: CMS_BLOCK_TYPE_VALUES })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Conteúdo' })
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Ordem' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ description: 'Status', enum: CMS_STATUS_VALUES })
  @IsOptional()
  @IsString()
  status?: string;
}

// --- CMS Media DTOs ---

export class CreateCmsMediaDto {
  @ApiProperty({ description: 'URL do arquivo', example: 'https://cdn.businessos.com/hero.jpg' })
  @IsString()
  url!: string;

  @ApiPropertyOptional({ description: 'Texto alternativo', example: 'Imagem hero varejo' })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional({ description: 'Tipo de mídia', example: 'image' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Tamanho em bytes', example: 102400 })
  @IsOptional()
  @IsInt()
  @Min(0)
  size?: number;

  @ApiPropertyOptional({ description: 'Nicho', enum: NICHE_VALUES })
  @IsOptional()
  @IsString()
  niche?: string;
}
