import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ description: 'Nome da organização', example: 'Minha Empresa LTDA' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Nicho/segmento da empresa',
    enum: ['RETAIL', 'ECOMMERCE', 'SERVICES', 'FOOD', 'PROFESSIONAL', 'CONSTRUCTION', 'HEALTH', 'EDUCATION', 'OTHER'],
    example: 'SERVICES',
  })
  @IsOptional()
  @IsEnum(['RETAIL', 'ECOMMERCE', 'SERVICES', 'FOOD', 'PROFESSIONAL', 'CONSTRUCTION', 'HEALTH', 'EDUCATION', 'OTHER'])
  niche?: string;

  @ApiPropertyOptional({ description: 'Configurações da organização', example: { timezone: 'America/Sao_Paulo', currency: 'BRL' } })
  @IsOptional()
  settings?: Record<string, any>;
}

export class AddMemberDto {
  @ApiProperty({ description: 'Nome do membro', example: 'Ana Costa' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Email do membro', example: 'ana@empresa.com' })
  @IsString()
  email!: string;

  @ApiProperty({ description: 'Senha temporária (mínimo 8 caracteres)', example: 'tempPassword1' })
  @IsString()
  password!: string;

  @ApiProperty({ description: 'Nome da role a atribuir', example: 'admin' })
  @IsString()
  roleName!: string;
}
