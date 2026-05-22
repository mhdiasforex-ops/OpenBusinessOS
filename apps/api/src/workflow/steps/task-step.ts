import { Injectable, Logger } from '@nestjs/common';
import { StepHandler, StepContext, StepExecutionResult } from './step-types';

@Injectable()
export class TaskStep implements StepHandler {
  private readonly logger = new Logger(TaskStep.name);

  async execute(step: any, context: StepContext): Promise<StepExecutionResult> {
    switch (step.type) {
      case 'CREATE_TASK':
        this.logger.log(`[STEP] Creating task: ${step.config.title}`);
        return {
          success: true,
          data: { action: 'task_created', title: step.config.title },
        };

      case 'UPDATE_STATUS':
        this.logger.log(`[STEP] Updating status: ${step.config.entity} -> ${step.config.newStatus}`);
        return {
          success: true,
          data: { action: 'status_updated', entity: step.config.entity, newStatus: step.config.newStatus },
        };

      default:
        return { success: false, error: `Unknown task step type: ${step.type}` };
    }
  }
}
