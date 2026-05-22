import { Injectable, Logger } from '@nestjs/common';
import { StepHandler, StepContext, StepExecutionResult } from './step-types';

@Injectable()
export class NotifyStep implements StepHandler {
  private readonly logger = new Logger(NotifyStep.name);

  async execute(step: any, context: StepContext): Promise<StepExecutionResult> {
    switch (step.type) {
      case 'SEND_EMAIL':
        this.logger.log(`[STEP] Sending email: ${JSON.stringify(step.config)}`);
        // MVP: Log the email action. In production: integrate with email provider
        return {
          success: true,
          data: { action: 'email_sent', to: step.config.to, subject: step.config.subject },
        };

      case 'SEND_WHATSAPP':
        this.logger.log(`[STEP] Sending WhatsApp: ${JSON.stringify(step.config)}`);
        return {
          success: true,
          data: { action: 'whatsapp_sent', to: step.config.to },
        };

      default:
        return { success: false, error: `Unknown notify step type: ${step.type}` };
    }
  }
}
