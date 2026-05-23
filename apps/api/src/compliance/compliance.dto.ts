import { IsString, IsOptional, IsEnum, IsDateString, IsJSON } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Enums (espelhando Prisma) ──────────────────────────────────────────

export enum ComplianceCouncil {
  CRM = 'CRM',
  CFO = 'CFO',
  OAB = 'OAB',
  CREA = 'CREA',
  CAU = 'CAU',
  CRC = 'CRC',
  CRECI = 'CRECI',
}

export enum ComplianceRecordStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

// ── Create ─────────────────────────────────────────────────────────────

export class CreateComplianceRecordDto {
  @ApiProperty({ enum: ComplianceCouncil, description: 'Conselho de classe' })
  @IsEnum(ComplianceCouncil)
  council!: ComplianceCouncil;

  @ApiProperty({ description: 'Número de registro no conselho' })
  @IsString()
  registrationNumber!: string;

  @ApiProperty({ description: 'Nome do profissional' })
  @IsString()
  professionalName!: string;

  @ApiPropertyOptional({ description: 'Especialidade' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ description: 'UF (ex: SP, RJ)' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Data de expiração ISO 8601' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Tipo do documento' })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({ description: 'URL do documento' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais (JSON)' })
  @IsOptional()
  @IsJSON()
  metadata?: Record<string, any>;
}

// ── Update ─────────────────────────────────────────────────────────────

export class UpdateComplianceRecordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  professionalName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ enum: ComplianceRecordStatus })
  @IsOptional()
  @IsEnum(ComplianceRecordStatus)
  status?: ComplianceRecordStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsJSON()
  metadata?: Record<string, any>;
}
