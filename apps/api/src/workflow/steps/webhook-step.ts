import { Injectable, Logger } from '@nestjs/common';
import { StepHandler, StepContext, StepExecutionResult } from './step-types';

@Injectable()
export class WebhookStep implements StepHandler {
  private readonly logger = new Logger(WebhookStep.name);

  async execute(step: any, context: StepContext): Promise<StepExecutionResult> {
    this.logger.log(`[STEP] Calling webhook: ${step.config.url}`);
    try {
      const response = await fetch(step.config.url, {
        method: step.config.method || 'POST',
        headers: { 'Content-Type': 'application/json', ...(step.config.headers || {}) },
        body: JSON.stringify({ step: step.config, context: context.triggerData }),
      });
      return { success: response.ok, data: { status: response.status } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
