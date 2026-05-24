import { IsString, IsEnum, IsOptional, IsBoolean, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EmailTemplateType {
  WELCOME = 'WELCOME',
  INVOICE = 'INVOICE',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  CUSTOM = 'CUSTOM',
}

export class CreateEmailTemplateDto {
  @ApiProperty() @IsString() @Length(2, 100) name!: string;
  @ApiProperty() @IsString() @Length(3, 200) subject!: string;
  @ApiProperty() @IsString() @Length(10, 50000) body!: string;
  @ApiProperty() @IsEnum(EmailTemplateType) type!: EmailTemplateType;
  @ApiPropertyOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateEmailTemplateDto {
  @ApiPropertyOptional() @IsString() @Length(2, 100) name?: string;
  @ApiPropertyOptional() @IsString() @Length(3, 200) subject?: string;
  @ApiPropertyOptional() @IsString() @Length(10, 50000) body?: string;
  @ApiPropertyOptional() @IsEnum(EmailTemplateType) type?: EmailTemplateType;
  @ApiPropertyOptional() @IsBoolean() isActive?: boolean;
}

export class PreviewEmailTemplateDto {
  @ApiPropertyOptional() variables?: Record<string, string>;
}
