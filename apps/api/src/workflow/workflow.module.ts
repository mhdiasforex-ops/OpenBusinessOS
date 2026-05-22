import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowExecutorService } from './workflow-executor.service';
import { WorkflowEngine } from './engine';
import { ExecutionLogService } from './execution-log.service';
import { StepHandlerRegistry, NotifyStep, TaskStep, WebhookStep, AiStep, UtilityStep } from './steps';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    WorkflowExecutorService,
    WorkflowEngine,
    ExecutionLogService,
    // Step handlers
    NotifyStep,
    TaskStep,
    WebhookStep,
    AiStep,
    UtilityStep,
    // Step handler registry (depends on all step handlers)
    StepHandlerRegistry,
  ],
  exports: [WorkflowService],
})
export class WorkflowModule {}
