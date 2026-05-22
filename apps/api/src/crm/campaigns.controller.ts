import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { CreateCampaignDto } from './crm.dto';

@ApiTags('crm/campaigns')
@ApiBearerAuth()
@Controller('crm/campaigns')
@UseGuards(JwtGuard, PermissionsGuard)
export class CampaignsController {
  constructor(private crmService: CrmService) {}

  @Post()
  @Permissions('crm:manage')
  @ApiOperation({ summary: 'Criar campanha de marketing' })
  async createCampaign(@Request() req: any, @Body() dto: CreateCampaignDto) {
    return this.crmService.createCampaign(req.user.organizationId, dto);
  }

  @Get()
  @Permissions('crm:read')
  @ApiOperation({ summary: 'Listar campanhas (MVP — armazenadas como eventos)' })
  async getCampaigns(@Request() req: any) {
    return { data: [], total: 0, message: 'Campanhas armazenadas como eventos (MVP)' };
  }
}
