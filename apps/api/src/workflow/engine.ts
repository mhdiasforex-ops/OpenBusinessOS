import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../events/event-bus.service';
import { EventTypes } from '@openbusinessos/event-definitions';
import { StepHandlerRegistry, StepContext, StepExecutionResult } from './steps';
import { ExecutionLogService } from './execution-log.service';

@Injectable()
export class WorkflowEngine {
  private readonly logger = new Logger(WorkflowEngine.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly stepRegistry: StepHandlerRegistry,
    private readonly executionLog: ExecutionLogService,
  ) {}

  /**
   * Executa um workflow completo dado o workflow e os dados do trigger.
   * Retorna o executionId para rastreamento.
   */
  async executeWorkflow(workflow: any, triggerData: any): Promise<string> {
    const executionId = this.executionLog.startExecution(
      workflow.id,
      workflow.organizationId,
      triggerData,
    );

    await this.eventBus.emit({
      organizationId: workflow.organizationId,
      type: EventTypes.WORKFLOW_TRIGGERED,
      source: 'workflow-engine',
      payload: {
        workflowId: workflow.id,
        executionId,
        triggerEvent: workflow.trigger,
        triggerData,
      },
    });

    try {
      // Evaluate workflow-level conditions
      if (workflow.conditions && Object.keys(workflow.conditions).length > 0) {
        const conditionsMet = this.evaluateConditions(workflow.conditions, triggerData);
        if (!conditionsMet) {
          this.logger.debug(`Workflow ${workflow.id} conditions not met, skipping`);
          await this.executionLog.completeExecution(executionId);
          return executionId;
        }
      }

      // Build step context
      const context: StepContext = {
        triggerData,
        workflowId: workflow.id,
        organizationId: workflow.organizationId,
        evaluateConditions: (conditions, data) => this.evaluateConditions(conditions, data),
      };

      // Execute steps in order
      for (const step of workflow.steps) {
        const result: StepExecutionResult = await this.stepRegistry.execute(step, context);

        this.executionLog.logStep(
          executionId,
          step.order,
          step.type,
          result.success,
          result.data,
          result.error,
        );

        if (!result.success) {
          this.logger.warn(`Step ${step.order} of workflow ${workflow.id} failed: ${result.error}`);

          // Try fallback if available
          if (step.fallback) {
            this.logger.log(`Executing fallback for step ${step.order}`);
            await this.executeFallbackAction(step.fallback, triggerData);
          }

          // For MVP: continue execution even if a step fails
          // In production: could break or implement retry logic
        }
      }

      await this.executionLog.completeExecution(executionId);

      const entry = this.executionLog.getExecution(executionId);
      const duration = entry?.duration ?? 0;

      await this.eventBus.emit({
        organizationId: workflow.organizationId,
        type: EventTypes.WORKFLOW_COMPLETED,
        source: 'workflow-engine',
        payload: {
          workflowId: workflow.id,
          executionId,
          duration,
        },
      });

      this.logger.log(`Workflow ${workflow.id} completed in ${duration}ms`);
    } catch (error: any) {
      await this.executionLog.failExecution(executionId, error.message);

      await this.eventBus.emit({
        organizationId: workflow.organizationId,
        type: EventTypes.WORKFLOW_FAILED,
        source: 'workflow-engine',
        payload: {
          workflowId: workflow.id,
          executionId,
          stepIndex: -1,
          error: error.message,
        },
      });

      this.logger.error(`Workflow ${workflow.id} failed: ${error.message}`);
    }

    return executionId;
  }

  /**
   * Avalia conditions comparando valores esperados com dados do trigger.
   * Suporta notacao de ponto para campos aninhados (e.g. "payload.customerId").
   */
  evaluateConditions(conditions: Record<string, any>, data: any): boolean {
    for (const [key, expected] of Object.entries(conditions)) {
      const actual = this.getNestedValue(data, key);
      if (actual !== expected) return false;
    }
    return true;
  }

  /**
   * Executa acao de fallback para um step que falhou.
   * MVP: apenas log. Producao: implementar estrategias de fallback.
   */
  private async executeFallbackAction(fallback: any, context: any): Promise<void> {
    this.logger.log(`Executing fallback: ${JSON.stringify(fallback)}`);
    // MVP: just log. Production: implement fallback strategies
  }

  /**
   * Obtem valor de campo aninhado via notacao de ponto.
   * e.g. getNestedValue({ a: { b: 1 }}, 'a.b') => 1
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
