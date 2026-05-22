import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { EventTypes } from '@openbusinessos/event-definitions';
import { WorkflowEngine } from './engine';

@Injectable()
export class WorkflowExecutorService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowExecutorService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    private prisma: PrismaService,
    private engine: WorkflowEngine,
  ) {}

  onModuleInit() {
    // Subscribe to all event types and check for matching workflows
    Object.values(EventTypes).forEach((eventType) => {
      this.eventEmitter.on(eventType, async (payload: any) => {
        await this.processTrigger(eventType, payload);
      });
    });

    this.logger.log('Workflow executor subscribed to all events');
  }

  async processTrigger(eventType: string, payload: any) {
    const orgId = payload.organizationId;
    if (!orgId) return;

    // Find active workflows matching this trigger
    const workflows = await this.prisma.workflow.findMany({
      where: { organizationId: orgId, trigger: eventType, isActive: true },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    for (const workflow of workflows) {
      this.logger.log(`Triggering workflow ${workflow.id} for event ${eventType}`);
      await this.engine.executeWorkflow(workflow, payload);
    }
  }
}
