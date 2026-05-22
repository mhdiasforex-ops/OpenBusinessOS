import { Injectable, Logger } from '@nestjs/common';
import { StepHandler, StepContext, StepExecutionResult } from './step-types';
import { NotifyStep } from './notify-step';
import { TaskStep } from './task-step';
import { WebhookStep } from './webhook-step';
import { AiStep } from './ai-step';
import { UtilityStep } from './utility-step';

type StepType = string;

@Injectable()
export class StepHandlerRegistry {
  private readonly logger = new Logger(StepHandlerRegistry.name);
  private readonly handlers = new Map<StepType, StepHandler>();

  constructor(
    private readonly notifyStep: NotifyStep,
    private readonly taskStep: TaskStep,
    private readonly webhookStep: WebhookStep,
    private readonly aiStep: AiStep,
    private readonly utilityStep: UtilityStep,
  ) {
    this.register('SEND_EMAIL', this.notifyStep);
    this.register('SEND_WHATSAPP', this.notifyStep);
    this.register('CREATE_TASK', this.taskStep);
    this.register('UPDATE_STATUS', this.taskStep);
    this.register('WEBHOOK', this.webhookStep);
    this.register('AI_ACTION', this.aiStep);
    this.register('DELAY', this.utilityStep);
    this.register('CONDITION', this.utilityStep);

    this.logger.log(`StepHandlerRegistry initialized with ${this.handlers.size} handlers`);
  }

  register(type: StepType, handler: StepHandler): void {
    this.handlers.set(type, handler);
  }

  getHandler(type: StepType): StepHandler | undefined {
    return this.handlers.get(type);
  }

  hasHandler(type: StepType): boolean {
    return this.handlers.has(type);
  }

  async execute(step: any, context: StepContext): Promise<StepExecutionResult> {
    const handler = this.handlers.get(step.type);
    if (!handler) {
      return { success: false, error: `Unknown step type: ${step.type}` };
    }
    return handler.execute(step, context);
  }
}

export { NotifyStep } from './notify-step';
export { TaskStep } from './task-step';
export { WebhookStep } from './webhook-step';
export { AiStep } from './ai-step';
export { UtilityStep } from './utility-step';
export type { StepHandler, StepContext, StepExecutionResult } from './step-types';
