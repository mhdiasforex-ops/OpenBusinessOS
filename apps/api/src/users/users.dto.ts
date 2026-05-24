import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ──────────────────────────────────────────────
// Update Profile (PATCH /users/profile)
// ──────────────────────────────────────────────

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Nome do usuário', example: 'João Silva' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Telefone do usuário', example: '+55 11 99999-0000' })
  @IsOptional()
  @IsString()
  phone?: string;
}

// ──────────────────────────────────────────────
// Update Role (PATCH /users/:id/role)
// ──────────────────────────────────────────────

export class UpdateUserRoleDto {
  @ApiProperty({ description: 'ID do novo cargo (role)', example: 'clx123abc' })
  @IsString()
  roleId!: string;
}

// ──────────────────────────────────────────────
// Filters (query params for GET /users)
// ──────────────────────────────────────────────

export class UserFiltersDto {
  @ApiPropertyOptional({ description: 'Buscar por nome ou email', example: 'joao' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID do cargo (role)', example: 'clx123abc' })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({ description: 'Página (começa em 1)', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', example: 25, default: 25 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  perPage?: number;
}
