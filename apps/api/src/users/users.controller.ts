import { Controller, Get, Patch, Delete, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { UpdateProfileDto, UpdateUserRoleDto, UserFiltersDto } from './users.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtGuard, PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ──────────────────────────────────────────────
  // LIST — listar usuários da organização
  // ──────────────────────────────────────────────

  @Get()
  @Permissions('users:read')
  @ApiOperation({ summary: 'Listar usuários da organização com filtros e paginação' })
  @ApiResponse({ status: 200, description: 'Lista paginada de usuários' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente' })
  async getUsers(@Request() req: any, @Query() filters: UserFiltersDto) {
    return this.usersService.getUsers(req.user.organizationId, filters);
  }

  // ──────────────────────────────────────────────
  // PROFILE — perfil do usuário logado
  // ──────────────────────────────────────────────

  @Get('profile')
  @ApiOperation({ summary: 'Buscar perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário com cargo e permissões' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  // ──────────────────────────────────────────────
  // UPDATE PROFILE — atualizar nome e telefone
  // ──────────────────────────────────────────────

  @Patch('profile')
  @ApiOperation({ summary: 'Atualizar perfil do usuário logado (nome e telefone)' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  // ──────────────────────────────────────────────
  // UPDATE ROLE — alterar cargo de usuário (admin)
  // ──────────────────────────────────────────────

  @Patch(':id/role')
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Alterar cargo de um usuário (apenas admin)' })
  @ApiParam({ name: 'id', description: 'ID do usuário (cuid)' })
  @ApiResponse({ status: 200, description: 'Cargo atualizado com sucesso' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente' })
  @ApiResponse({ status: 404, description: 'Usuário ou cargo não encontrado' })
  async updateUserRole(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(req.user.organizationId, id, dto, req.user.id);
  }

  // ──────────────────────────────────────────────
  // DELETE — remover usuário (admin)
  // ──────────────────────────────────────────────

  @Delete(':id')
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Remover usuário da organização (apenas admin)' })
  @ApiParam({ name: 'id', description: 'ID do usuário (cuid)' })
  @ApiResponse({ status: 200, description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async deleteUser(@Request() req: any, @Param('id') id: string) {
    return this.usersService.deleteUser(req.user.organizationId, id, req.user.id);
  }
}
