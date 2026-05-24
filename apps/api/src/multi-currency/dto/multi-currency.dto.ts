import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SupportedCurrency {
  BRL = 'BRL',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  ARS = 'ARS',
  CLP = 'CLP',
  MXN = 'MXN',
  COP = 'COP',
  PEN = 'PEN',
  UYU = 'UYU',
  PYG = 'PYG',
  BOB = 'BOB',
}

export class CreateExchangeRateDto {
  @ApiProperty({
    description: 'Moeda de origem',
    enum: SupportedCurrency,
    example: 'USD',
  })
  @IsEnum(SupportedCurrency)
  fromCurrency!: SupportedCurrency;

  @ApiProperty({
    description: 'Moeda de destino',
    enum: SupportedCurrency,
    example: 'BRL',
  })
  @IsEnum(SupportedCurrency)
  toCurrency!: SupportedCurrency;

  @ApiProperty({
    description: 'Taxa de câmbio (ex: 5.25 significa 1 fromCurrency = 5.25 toCurrency)',
    example: 5.25,
  })
  @IsNumber()
  rate!: number;

  @ApiPropertyOptional({
    description: 'Fonte da taxa de câmbio',
    example: 'manual',
  })
  @IsOptional()
  @IsString()
  source?: string;
}

export class ConvertDto {
  @ApiProperty({
    description: 'Valor a ser convertido',
    example: 100.00,
  })
  @IsNumber()
  amount!: number;

  @ApiProperty({
    description: 'Moeda de origem',
    enum: SupportedCurrency,
    example: 'USD',
  })
  @IsEnum(SupportedCurrency)
  fromCurrency!: SupportedCurrency;

  @ApiProperty({
    description: 'Moeda de destino',
    enum: SupportedCurrency,
    example: 'BRL',
  })
  @IsEnum(SupportedCurrency)
  toCurrency!: SupportedCurrency;
}
