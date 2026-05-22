export interface StepExecutionResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

export interface StepContext {
  triggerData: Record<string, any>;
  workflowId: string;
  organizationId: string;
  evaluateConditions: (conditions: Record<string, any>, data: any) => boolean;
}

export interface StepHandler {
  execute(step: any, context: StepContext): Promise<StepExecutionResult>;
}
