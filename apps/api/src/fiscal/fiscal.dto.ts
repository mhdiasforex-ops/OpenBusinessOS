import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Enums ────────────────────────────────────────────────────

export enum TipoDocumentoFiscal {
  NFE = 'NFE',
  NFCE = 'NFCE',
  NFSE = 'NFSE',
  CTE = 'CTE',
  MDFE = 'MDFE',
}

export enum SituacaoDocumento {
  AUTORIZADO = 'AUTORIZADO',
  CANCELADO = 'CANCELADO',
  INUTILIZADO = 'INUTILIZADO',
  DENEGADO = 'DENEGADO',
  PENDENTE = 'PENDENTE',
}

export enum RegimeTributario {
  SIMPLES_NACIONAL = 'SIMPLES_NACIONAL',
  SIMPLES_NACIONAL_EXCESSO = 'SIMPLES_NACIONAL_EXCESSO',
  LUCRO_PRESUMIDO = 'LUCRO_PRESUMIDO',
  LUCRO_REAL = 'LUCRO_REAL',
}

// ─── Destinatario ──────────────────────────────────────────────

export class DestinatarioDto {
  @ApiProperty() @IsString() nome!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() documento?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ie?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endereco?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() municipio?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() uf?: string;
}

// ─── Item NF-e ─────────────────────────────────────────────────

export class ItemNFeDto {
  @ApiProperty() @IsString() codigo!: string;
  @ApiProperty() @IsString() descricao!: string;
  @ApiProperty() @IsString() ncm!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cest?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cfop?: string;
  @ApiProperty() @IsString() unidade!: string;
  @ApiProperty() @IsNumber() @Type(() => Number) quantidade!: number;
  @ApiProperty() @IsNumber() @Type(() => Number) valorUnitario!: number;
  @ApiProperty() @IsNumber() @Type(() => Number) valorTotal!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) icmsBase?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) icmsAliquota?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) icmsValor?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) pisBase?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) pisAliquota?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) pisValor?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) cofinsBase?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) cofinsAliquota?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) cofinsValor?: number;
}

// ─── Emitir NF-e ───────────────────────────────────────────────

export class EmitirNFeDto {
  @ApiProperty() @IsNumber() @Type(() => Number) numero!: number;
  @ApiProperty() @IsNumber() @Type(() => Number) serie!: number;
  @ApiProperty() @IsString() naturezaOperacao!: string;
  @ApiProperty() @IsEnum(RegimeTributario) regimeTributario!: RegimeTributario;
  @ApiProperty() @ValidateNested() @Type(() => DestinatarioDto) destinatario!: DestinatarioDto;
  @ApiProperty() @IsArray() @ValidateNested({ each: true }) @Type(() => ItemNFeDto) itens!: ItemNFeDto[];
  @ApiProperty() @IsNumber() @Type(() => Number) total!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) frete?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) desconto?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() informacoesComplementares?: string;
}

// ─── Emitir NFC-e ──────────────────────────────────────────────

export class EmitirNFCeDto {
  @ApiProperty() @IsNumber() @Type(() => Number) numero!: number;
  @ApiProperty() @IsNumber() @Type(() => Number) serie!: number;
  @ApiProperty() @IsArray() @ValidateNested({ each: true }) @Type(() => ItemNFeDto) itens!: ItemNFeDto[];
  @ApiProperty() @IsNumber() @Type(() => Number) total!: number;
  @ApiPropertyOptional() @IsOptional() @ValidateNested() @Type(() => DestinatarioDto) destinatario?: DestinatarioDto;
  @ApiPropertyOptional() @IsOptional() @IsString() formaPagamento?: string;
}

// ─── Prestador NFS-e ───────────────────────────────────────────

export class PrestadorDto {
  @ApiProperty() @IsString() nome!: string;
  @ApiProperty() @IsString() documento!: string;
  @ApiProperty() @IsString() inscricaoMunicipal!: string;
  @ApiProperty() @IsString() municipio!: string;
  @ApiProperty() @IsString() uf!: string;
}

// ─── Emitir NFS-e ──────────────────────────────────────────────

export class EmitirNFSeDto {
  @ApiProperty() @ValidateNested() @Type(() => PrestadorDto) prestador!: PrestadorDto;
  @ApiProperty() @ValidateNested() @Type(() => DestinatarioDto) tomador!: DestinatarioDto;
  @ApiProperty() @IsString() descricaoServico!: string;
  @ApiProperty() @IsString() itemListaServico!: string;
  @ApiProperty() @IsString() codigoCnae!: string;
  @ApiProperty() @IsNumber() @Type(() => Number) valorServico!: number;
  @ApiProperty() @IsNumber() @Type(() => Number) baseCalculo!: number;
  @ApiProperty() @IsNumber() @Type(() => Number) aliquotaIss!: number;
  @ApiProperty() @IsNumber() @Type(() => Number) valorIss!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) pis?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) cofins?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) ir?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) csll?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() dataCompetencia?: string;
}

// ─── Consulta ──────────────────────────────────────────────────

export class ConsultarDocFiscalDto {
  @ApiProperty() @IsEnum(TipoDocumentoFiscal) tipo!: TipoDocumentoFiscal;
  @ApiProperty() @IsString() chave!: string;
}
