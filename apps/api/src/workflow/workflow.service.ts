import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { WorkflowStepType } from '@prisma/client';
import { CreateWorkflowDto, UpdateWorkflowDto } from './workflow.dto';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async createWorkflow(orgId: string, dto: CreateWorkflowDto) {
    const workflow = await this.prisma.workflow.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        trigger: dto.trigger,
        conditions: dto.conditions || {},
        isActive: dto.isActive !== false,
        steps: {
    create: (dto.steps || []).map((step, index) => ({
          order: index + 1,
          organizationId: orgId,
          type: step.type as WorkflowStepType,
          config: step.config,
          fallback: step.fallback,
        })),
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    this.logger.log(`Workflow created: ${workflow.id} — trigger: ${dto.trigger}`);
    return workflow;
  }

  async getWorkflows(orgId: string, filters?: { isActive?: boolean }) {
    return this.prisma.workflow.findMany({
      where: { organizationId: orgId, ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}) },
      include: { steps: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWorkflow(orgId: string, id: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId: orgId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
    if (!workflow) throw new NotFoundException('Workflow não encontrado');
    return workflow;
  }

  async updateWorkflow(orgId: string, id: string, dto: UpdateWorkflowDto) {
    const existing = await this.prisma.workflow.findFirst({
      where: { id, organizationId: orgId },
      include: { steps: true },
    });
    if (!existing) throw new NotFoundException('Workflow não encontrado');

    // Update basic fields
    const workflow = await this.prisma.workflow.update({
      where: { id },
      data: {
        name: dto.name,
        trigger: dto.trigger,
        conditions: dto.conditions,
        isActive: dto.isActive,
      },
    });

    // If steps provided, replace them
    if (dto.steps) {
      await this.prisma.workflowStep.deleteMany({ where: { workflowId: id } });
      for (const step of dto.steps) {
    await this.prisma.workflowStep.create({
          data: {
            organizationId: orgId,
            workflowId: id,
            order: step.order,
            type: step.type as WorkflowStepType,
            config: step.config,
            fallback: step.fallback,
          },
        });
      }
    }

    return this.getWorkflow(orgId, id);
  }

  async deleteWorkflow(orgId: string, id: string) {
    const workflow = await this.prisma.workflow.findFirst({ where: { id, organizationId: orgId } });
    if (!workflow) throw new NotFoundException('Workflow não encontrado');

    await this.prisma.workflowStep.deleteMany({ where: { workflowId: id } });
    await this.prisma.workflow.delete({ where: { id } });
    return { message: 'Workflow removido' };
  }

  async toggleWorkflow(orgId: string, id: string) {
    const workflow = await this.prisma.workflow.findFirst({ where: { id, organizationId: orgId } });
    if (!workflow) throw new NotFoundException('Workflow não encontrado');

    return this.prisma.workflow.update({
      where: { id },
      data: { isActive: !workflow.isActive },
    });
  }
}
