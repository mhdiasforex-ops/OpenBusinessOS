import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ExecutionLogEntry {
  executionId: string;
  workflowId: string;
  organizationId: string;
  triggerData: Record<string, any>;
  startTime: number;
  steps: StepLogEntry[];
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  error?: string;
  duration?: number;
}

export interface StepLogEntry {
  stepOrder: number;
  stepType: string;
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  timestamp: number;
}

@Injectable()
export class ExecutionLogService {
  private readonly logger = new Logger(ExecutionLogService.name);

  /** In-memory map of active executions (keyed by executionId) */
  private readonly executions = new Map<string, ExecutionLogEntry>();

  constructor(private prisma: PrismaService) {}

  /**
   * Registra o inicio de uma execucao de workflow.
   * Retorna o executionId para rastreamento.
   */
  startExecution(workflowId: string, orgId: string, triggerData: Record<string, any>): string {
    const executionId = `exec_${Date.now()}_${workflowId.slice(-6)}`;

    const entry: ExecutionLogEntry = {
      executionId,
      workflowId,
      organizationId: orgId,
      triggerData,
      startTime: Date.now(),
      steps: [],
      status: 'RUNNING',
    };

    this.executions.set(executionId, entry);
    this.logger.debug(`Execution started: ${executionId} for workflow ${workflowId}`);

    return executionId;
  }

  /**
   * Registra o resultado de um step na execucao.
   */
  logStep(
    executionId: string,
    stepOrder: number,
    stepType: string,
    success: boolean,
    data?: Record<string, any>,
    error?: string,
  ): void {
    const entry = this.executions.get(executionId);
    if (!entry) {
      this.logger.warn(`Execution ${executionId} not found for step log`);
      return;
    }

    entry.steps.push({
      stepOrder,
      stepType,
      success,
      data,
      error,
      timestamp: Date.now(),
    });
  }

  /**
   * Registra a conclusao com sucesso da execucao.
   * Persiste o log em org settings (como JSON na tabela Event, ou futuro WorkflowExecution).
   */
  async completeExecution(executionId: string): Promise<void> {
    const entry = this.executions.get(executionId);
    if (!entry) {
      this.logger.warn(`Execution ${executionId} not found for completion`);
      return;
    }

    entry.status = 'COMPLETED';
    entry.duration = Date.now() - entry.startTime;

    await this.persistLog(entry);
    this.logger.log(`Execution ${executionId} completed in ${entry.duration}ms`);

    // Clean up from memory after persistence
    this.executions.delete(executionId);
  }

  /**
   * Registra a falha da execucao.
   * Persiste o log em org settings (como JSON na tabela Event, ou futuro WorkflowExecution).
   */
  async failExecution(executionId: string, error: string): Promise<void> {
    const entry = this.executions.get(executionId);
    if (!entry) {
      this.logger.warn(`Execution ${executionId} not found for failure`);
      return;
    }

    entry.status = 'FAILED';
    entry.error = error;
    entry.duration = Date.now() - entry.startTime;

    await this.persistLog(entry);
    this.logger.error(`Execution ${executionId} failed: ${error}`);

    // Clean up from memory after persistence
    this.executions.delete(executionId);
  }

  /**
   * Recupera o log de uma execucao ativa (em memoria).
   */
  getExecution(executionId: string): ExecutionLogEntry | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Persiste o log de execucao.
   * Como nao existe tabela WorkflowExecution no schema Prisma atual,
   * persistimos como um Event do tipo WORKFLOW_EXECUTION_LOG.
   * Quando a tabela WorkflowExecution for criada, basta trocar este metodo.
   */
  private async persistLog(entry: ExecutionLogEntry): Promise<void> {
    try {
      await this.prisma.event.create({
        data: {
          organizationId: entry.organizationId,
          type: 'WORKFLOW_EXECUTION_LOG',
          source: 'workflow-execution-log',
          payload: {
            executionId: entry.executionId,
            workflowId: entry.workflowId,
            status: entry.status,
            duration: entry.duration,
            steps: entry.steps,
            error: entry.error,
            triggerData: entry.triggerData,
          } as any,
          status: 'PROCESSED',
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to persist execution log ${entry.executionId}: ${err.message}`);
    }
  }
}
