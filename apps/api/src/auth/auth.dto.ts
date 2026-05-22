import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Nome completo do usuário', example: 'João Silva' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Email do usuário', example: 'joao@empresa.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Senha (mínimo 8 caracteres)', example: 'minhaSenha123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: 'Nome da organização/empresa', example: 'Minha Empresa LTDA' })
  @IsString()
  organizationName!: string;

  @ApiPropertyOptional({
    description: 'Nicho/segmento da empresa',
    enum: ['RETAIL', 'ECOMMERCE', 'SERVICES', 'FOOD', 'PROFESSIONAL', 'CONSTRUCTION', 'HEALTH', 'EDUCATION', 'OTHER'],
    example: 'SERVICES',
  })
  @IsOptional()
  @IsEnum(['RETAIL', 'ECOMMERCE', 'SERVICES', 'FOOD', 'PROFESSIONAL', 'CONSTRUCTION', 'HEALTH', 'EDUCATION', 'OTHER'])
  niche?: string;
}

export class LoginDto {
  @ApiProperty({ description: 'Email do usuário', example: 'joao@empresa.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'minhaSenha123' })
  @IsString()
  password!: string;
}

export class MfaVerifyDto {
  @ApiProperty({ description: 'ID do usuário para verificação MFA', example: 'usr_abc123' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'Código TOTP de 6 dígitos', example: '123456' })
  @IsString()
  code!: string;
}
