import { IsString, IsNumber, IsOptional, IsUUID, Min, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNfseDto {
  @ApiProperty() @IsUUID() customerId!: string;
  @ApiProperty() @IsString() @Length(3, 500) serviceDescription!: string;
  @ApiProperty() @IsString() @Length(2, 20) serviceCode!: string;
  @ApiProperty() @IsNumber() @Min(0) amount!: number;
  @ApiPropertyOptional() @IsNumber() @Min(0) issRate?: number;
  @ApiPropertyOptional() @IsNumber() @Min(0) pisRate?: number;
  @ApiPropertyOptional() @IsNumber() @Min(0) cofinsRate?: number;
  @ApiPropertyOptional() @IsNumber() @Min(0) csllRate?: number;
  @ApiPropertyOptional() @IsNumber() @Min(0) irRate?: number;
  @ApiProperty() @IsString() @Length(7, 7) cityCode!: string;
  @ApiPropertyOptional() @IsString() deductions?: string;
}

export class CancelNfseDto {
  @ApiProperty() @IsString() @Length(10, 500) reason!: string;
}
