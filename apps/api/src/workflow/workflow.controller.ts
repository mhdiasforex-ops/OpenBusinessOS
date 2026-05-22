import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { CreateWorkflowDto, UpdateWorkflowDto } from './workflow.dto';

@ApiTags('workflow')
@ApiBearerAuth()
@Controller('workflows')
@UseGuards(JwtGuard, PermissionsGuard)
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Post()
  @Permissions('workflows:manage')
  @ApiOperation({ summary: 'Criar workflow de automação' })
  async createWorkflow(@Request() req: any, @Body() dto: CreateWorkflowDto) {
    return this.workflowService.createWorkflow(req.user.organizationId, dto);
  }

  @Get()
  @Permissions('workflows:read')
  @ApiOperation({ summary: 'Listar workflows' })
  async getWorkflows(@Request() req: any) {
    return this.workflowService.getWorkflows(req.user.organizationId);
  }

  @Get(':id')
  @Permissions('workflows:read')
  @ApiOperation({ summary: 'Buscar workflow por ID' })
  async getWorkflow(@Request() req: any, @Param('id') id: string) {
    return this.workflowService.getWorkflow(req.user.organizationId, id);
  }

  @Patch(':id')
  @Permissions('workflows:manage')
  @ApiOperation({ summary: 'Atualizar workflow' })
  async updateWorkflow(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateWorkflowDto) {
    return this.workflowService.updateWorkflow(req.user.organizationId, id, dto);
  }

  @Delete(':id')
  @Permissions('workflows:manage')
  @ApiOperation({ summary: 'Remover workflow' })
  async deleteWorkflow(@Request() req: any, @Param('id') id: string) {
    return this.workflowService.deleteWorkflow(req.user.organizationId, id);
  }

  @Post(':id/toggle')
  @Permissions('workflows:manage')
  @ApiOperation({ summary: 'Ativar/desativar workflow' })
  async toggleWorkflow(@Request() req: any, @Param('id') id: string) {
    return this.workflowService.toggleWorkflow(req.user.organizationId, id);
  }
}
