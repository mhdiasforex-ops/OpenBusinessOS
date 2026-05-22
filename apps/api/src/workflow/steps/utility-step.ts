import { Injectable, Logger } from '@nestjs/common';
import { StepHandler, StepContext, StepExecutionResult } from './step-types';

@Injectable()
export class UtilityStep implements StepHandler {
  private readonly logger = new Logger(UtilityStep.name);

  async execute(step: any, context: StepContext): Promise<StepExecutionResult> {
    switch (step.type) {
      case 'DELAY': {
        const delayMs = (step.config.seconds || 60) * 1000;
        this.logger.log(`[STEP] Delay: ${delayMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 5000))); // Cap at 5s for MVP
        return { success: true };
      }

      case 'CONDITION': {
        const result = context.evaluateConditions(step.config, context.triggerData);
        return { success: true, data: { conditionMet: result } };
      }

      default:
        return { success: false, error: `Unknown utility step type: ${step.type}` };
    }
  }
}
