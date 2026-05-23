import { IsString, IsOptional, IsEnum, IsArray, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Enums ────────────────────────────────────────────────────

export enum LawfulBasis {
  CONSENTIMENTO = 'CONSENTIMENTO',
  CONTRATO = 'CONTRATO',
  OBRIGACAO_LEGAL = 'OBRIGACAO_LEGAL',
  INTERESSE_LEGITIMO = 'INTERESSE_LEGITIMO',
  PROTECAO_VIDA = 'PROTECAO_VIDA',
  EXERCICIO_REGULAR = 'EXERCICIO_REGULAR',
  TAREFA_PUBLICA = 'TAREFA_PUBLICA',
}

export enum ConsentStatus {
  ATIVO = 'ATIVO',
  REVOGADO = 'REVOGADO',
  EXPIRADO = 'EXPIRADO',
}

export enum RequestStatus {
  PENDENTE = 'PENDENTE',
  EM_PROCESSAMENTO = 'EM_PROCESSAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  REJEITADO = 'REJEITADO',
}

// ─── Consent ──────────────────────────────────────────────────

export class RegisterConsentDto {
  @ApiProperty() @IsString() subjectId!: string;
  @ApiProperty() @IsString() purpose!: string;
  @ApiProperty() @IsEnum(LawfulBasis) lawfulBasis!: LawfulBasis;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
}

export class UpdateConsentDto {
  @ApiProperty() @IsEnum(ConsentStatus) status!: ConsentStatus;
}

// ─── Data Subject ─────────────────────────────────────────────

export class DataAccessDto {
  @ApiProperty() @IsString() subjectId!: string;
  @ApiProperty() @IsString() requestType!: string;
}

export class ExportDataDto {
  @ApiProperty() @IsString() subjectId!: string;
  @ApiProperty() @IsEnum(['json', 'csv'] as const) format!: 'json' | 'csv';
}

export class DeleteDataDto {
  @ApiProperty() @IsString() subjectId!: string;
  @ApiProperty() @IsString() reason!: string;
}

export class AnonymizeDto {
  @ApiProperty() @IsString() subjectId!: string;
  @ApiProperty() @IsArray() @IsString({ each: true }) fields!: string[];
}

// ─── DPO ──────────────────────────────────────────────────────

export class ContactDpoDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() subject!: string;
  @ApiProperty() @IsString() message!: string;
}

// ─── Policies ─────────────────────────────────────────────────

export class UpdatePolicyDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() content!: string;
  @ApiProperty() @IsString() version!: string;
}
