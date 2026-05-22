import { Injectable, Logger } from '@nestjs/common';
import { StepHandler, StepContext, StepExecutionResult } from './step-types';

@Injectable()
export class AiStep implements StepHandler {
  private readonly logger = new Logger(AiStep.name);

  async execute(step: any, context: StepContext): Promise<StepExecutionResult> {
    this.logger.log(`[STEP] AI action: ${step.config.prompt}`);
    // MVP: placeholder. In production: call OpenAI/Anthropic API
    return {
      success: true,
      data: { action: 'ai_action', prompt: step.config.prompt },
    };
  }
}
