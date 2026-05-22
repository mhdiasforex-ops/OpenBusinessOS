import { Controller, Get, Patch, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles, Permissions, CurrentUser } from '../common/guards/decorators';
import { UpdateOrganizationDto, AddMemberDto } from './organization.dto';

@ApiTags('organization')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtGuard, RolesGuard, PermissionsGuard)
export class OrganizationController {
  constructor(private orgService: OrganizationService) {}

  @Get(':id')
  @Permissions('organization:read')
  @ApiOperation({ summary: 'Buscar organização por ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orgService.findById(id);
  }

  @Patch(':id')
  @Permissions('organization:manage')
  @ApiOperation({ summary: 'Atualizar dados da organização' })
  async update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.orgService.update(id, dto);
  }

  @Get(':id/members')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Listar membros da organização' })
  async getMembers(@Param('id') id: string) {
    return this.orgService.getMembers(id);
  }

  @Post(':id/members')
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Adicionar membro à organização' })
  async addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.orgService.addMember(id, dto);
  }

  @Delete(':id/members/:userId')
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Remover membro da organização' })
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.orgService.removeMember(id, userId);
  }

  @Get(':id/stats')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Estatísticas da organização' })
  async getStats(@Param('id') id: string) {
    return this.orgService.getStats(id);
  }
}
