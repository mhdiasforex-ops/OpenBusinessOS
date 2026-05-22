import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtGuard } from './jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions, CurrentUser } from '../common/guards/decorators';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtGuard, PermissionsGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @Permissions('users:read')
  @ApiOperation({ summary: 'Listar roles da organização' })
  async getRoles(@CurrentUser() user: any) {
    return this.rolesService.getRoles(user.organizationId);
  }

  @Post()
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Criar role personalizada' })
  async createRole(
    @CurrentUser() user: any,
    @Body() body: { name: string; permissions: string[] },
  ) {
    return this.rolesService.createRole(user.organizationId, body.name, body.permissions);
  }

  @Patch(':id')
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Atualizar permissões de uma role' })
  async updateRole(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { permissions: string[] },
  ) {
    return this.rolesService.updateRole(id, user.organizationId, body.permissions);
  }

  @Delete(':id')
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Remover role' })
  async deleteRole(@CurrentUser() user: any, @Param('id') id: string) {
    return this.rolesService.deleteRole(id, user.organizationId);
  }

  @Post('assign')
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Atribuir role a um usuário' })
  async assignRole(
    @CurrentUser() user: any,
    @Body() body: { userId: string; roleId: string },
  ) {
    return this.rolesService.assignRole(body.userId, body.roleId, user.organizationId);
  }

  @Post('revoke')
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Revogar role de um usuário' })
  async revokeRole(@Body() body: { userId: string; roleId: string }) {
    return this.rolesService.revokeRole(body.userId, body.roleId);
  }
}
