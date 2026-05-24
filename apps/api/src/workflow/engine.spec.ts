import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowEngine } from './engine';
import { EventBusService } from '../events/event-bus.service';
import { StepHandlerRegistry } from './steps';
import { ExecutionLogService } from './execution-log.service';
import { EventTypes } from '@openbusinessos/event-definitions';

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;
  let eventBus: any;
  let stepRegistry: any;
  let executionLog: any;

  const orgId = 'org-1';
  const workflowId = 'wf-1';

  const defaultWorkflow = {
    id: workflowId,
    organizationId: orgId,
    trigger: 'ORDER_CREATED',
    conditions: {},
    steps: [
      { order: 1, type: 'SEND_EMAIL', config: { to: 'test@test.com' } },
    ],
  };

  beforeEach(() => {
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) };
    stepRegistry = {
      execute: vi.fn().mockResolvedValue({ success: true, data: { sent: true } }),
      getHandler: vi.fn(),
      hasHandler: vi.fn(),
    };
    executionLog = {
      startExecution: vi.fn().mockReturnValue('exec_12345_wf-1'),
      logStep: vi.fn(),
      completeExecution: vi.fn().mockResolvedValue(undefined),
      failExecution: vi.fn().mockResolvedValue(undefined),
      getExecution: vi.fn(),
    };
    engine = new WorkflowEngine(eventBus, stepRegistry, executionLog);
  });

  describe('executeWorkflow', () => {
    it('should execute a workflow with steps successfully', async () => {
      executionLog.getExecution.mockReturnValue({
        executionId: 'exec_12345_wf-1',
        duration: 150,
      });

      const result = await engine.executeWorkflow(defaultWorkflow, { event: 'test' });

      expect(result).toBe('exec_12345_wf-1');
      expect(executionLog.startExecution).toHaveBeenCalledWith(
        workflowId, orgId, { event: 'test' },
      );
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.WORKFLOW_TRIGGERED,
          payload: expect.objectContaining({ workflowId, executionId: 'exec_12345_wf-1' }),
        }),
      );
      expect(stepRegistry.execute).toHaveBeenCalledWith(
        defaultWorkflow.steps[0],
        expect.objectContaining({
          triggerData: { event: 'test' },
          workflowId,
          organizationId: orgId,
        }),
      );
      expect(executionLog.logStep).toHaveBeenCalledWith(
        'exec_12345_wf-1', 1, 'SEND_EMAIL', true, { sent: true }, undefined,
      );
      expect(executionLog.completeExecution).toHaveBeenCalledWith('exec_12345_wf-1');
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.WORKFLOW_COMPLETED,
          payload: expect.objectContaining({ workflowId, executionId: 'exec_12345_wf-1', duration: 150 }),
        }),
      );
    });

    it('should evaluate workflow-level conditions and skip execution if not met', async () => {
      const workflowWithConditions = {
        ...defaultWorkflow,
        conditions: { status: 'ACTIVE' },
      };

      await engine.executeWorkflow(workflowWithConditions, { status: 'INACTIVE' });

      expect(stepRegistry.execute).not.toHaveBeenCalled();
      expect(executionLog.completeExecution).toHaveBeenCalledWith('exec_12345_wf-1');
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: EventTypes.WORKFLOW_TRIGGERED }),
      );
    });

    it('should proceed with execution when workflow-level conditions are met', async () => {
      executionLog.getExecution.mockReturnValue({ executionId: 'exec_12345_wf-1', duration: 50 });

      const workflowWithConditions = {
        ...defaultWorkflow,
        conditions: { status: 'ACTIVE' },
      };

      await engine.executeWorkflow(workflowWithConditions, { status: 'ACTIVE' });

      expect(stepRegistry.execute).toHaveBeenCalled();
      expect(executionLog.completeExecution).toHaveBeenCalledWith('exec_12345_wf-1');
    });

    it('should skip condition evaluation when workflow has no conditions', async () => {
      executionLog.getExecution.mockReturnValue({ executionId: 'exec_12345_wf-1', duration: 50 });

      await engine.executeWorkflow(defaultWorkflow, { anything: 'goes' });

      expect(stepRegistry.execute).toHaveBeenCalled();
      expect(executionLog.completeExecution).toHaveBeenCalled();
    });

    it('should log step failure and execute fallback when step fails', async () => {
      stepRegistry.execute.mockResolvedValue({ success: false, error: 'Email API down' });

      const workflowWithFallback = {
        ...defaultWorkflow,
        steps: [
          {
            order: 1,
            type: 'SEND_EMAIL',
            config: { to: 'test@test.com' },
            fallback: { channel: 'SMS', message: 'Fallback sent' },
          },
        ],
      };

      executionLog.getExecution.mockReturnValue({ executionId: 'exec_12345_wf-1', duration: 100 });

      await engine.executeWorkflow(workflowWithFallback, { event: 'test' });

      expect(executionLog.logStep).toHaveBeenCalledWith(
        'exec_12345_wf-1', 1, 'SEND_EMAIL', false, undefined, 'Email API down',
      );
      expect(executionLog.completeExecution).toHaveBeenCalled();
    });

    it('should continue execution after a step fails (MVP behavior)', async () => {
      stepRegistry.execute
        .mockResolvedValueOnce({ success: false, error: 'Step 1 failed' })
        .mockResolvedValueOnce({ success: true, data: { done: true } });

      const multiStepWorkflow = {
        ...defaultWorkflow,
        steps: [
          { order: 1, type: 'SEND_EMAIL', config: {} },
          { order: 2, type: 'CREATE_TASK', config: {} },
        ],
      };

      executionLog.getExecution.mockReturnValue({ executionId: 'exec_12345_wf-1', duration: 200 });

      await engine.executeWorkflow(multiStepWorkflow, { event: 'test' });

      expect(stepRegistry.execute).toHaveBeenCalledTimes(2);
      expect(executionLog.completeExecution).toHaveBeenCalled();
    });

    it('should handle errors and mark execution as failed', async () => {
      stepRegistry.execute.mockRejectedValue(new Error('Unexpected error'));

      await engine.executeWorkflow(defaultWorkflow, { event: 'test' });

      expect(executionLog.failExecution).toHaveBeenCalledWith(
        'exec_12345_wf-1',
        'Unexpected error',
      );
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.WORKFLOW_FAILED,
          payload: expect.objectContaining({
            workflowId,
            executionId: 'exec_12345_wf-1',
            error: 'Unexpected error',
          }),
        }),
      );
      expect(executionLog.completeExecution).not.toHaveBeenCalled();
    });

    it('should handle errors with missing execution entry gracefully', async () => {
      executionLog.startExecution.mockReturnValue('exec_error_12345');
      stepRegistry.execute.mockRejectedValue(new Error('Critical failure'));
      executionLog.getExecution.mockReturnValue(undefined);

      await engine.executeWorkflow(defaultWorkflow, { event: 'test' });

      expect(executionLog.failExecution).toHaveBeenCalledWith(
        'exec_error_12345', 'Critical failure',
      );
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: EventTypes.WORKFLOW_FAILED }),
      );
    });

    it('should evaluate nested conditions with dot notation', async () => {
      const workflowWithNestedConditions = {
        ...defaultWorkflow,
        conditions: { 'payload.customerId': '123' },
      };

      await engine.executeWorkflow(workflowWithNestedConditions, {
        payload: { customerId: '123', name: 'John' },
      });

      expect(stepRegistry.execute).toHaveBeenCalled();
    });

    it('should use entry.duration when getExecution returns entry', async () => {
      executionLog.getExecution.mockReturnValue({
        executionId: 'exec_12345_wf-1',
        duration: 300,
      });

      await engine.executeWorkflow(defaultWorkflow, { event: 'test' });

      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ duration: 300 }),
        }),
      );
    });
  });

  describe('evaluateConditions', () => {
    it('should return true when all conditions match', () => {
      const result = engine.evaluateConditions({ status: 'ACTIVE', type: 'PREMIUM' }, { status: 'ACTIVE', type: 'PREMIUM' });
      expect(result).toBe(true);
    });

    it('should return false when any condition does not match', () => {
      const result = engine.evaluateConditions({ status: 'ACTIVE' }, { status: 'INACTIVE' });
      expect(result).toBe(false);
    });

    it('should return true for empty conditions', () => {
      const result = engine.evaluateConditions({}, { anything: 'goes' });
      expect(result).toBe(true);
    });

    it('should resolve nested dot-notation keys', () => {
      const result = engine.evaluateConditions(
        { 'data.amount': 100 },
        { data: { amount: 100 } },
      );
      expect(result).toBe(true);
    });

    it('should return false for missing nested keys', () => {
      const result = engine.evaluateConditions(
        { 'data.amount': 100 },
        { data: {} },
      );
      expect(result).toBe(false);
    });

    it('should return false when nested path resolves to undefined', () => {
      const result = engine.evaluateConditions(
        { 'a.b.c': 'value' },
        { a: {} },
      );
      expect(result).toBe(false);
    });

    it('should return false when data is null or undefined at a path segment', () => {
      const result = engine.evaluateConditions(
        { 'a.b.c': 'value' },
        { a: null },
      );
      expect(result).toBe(false);
    });

    it('should handle multiple conditions where one fails', () => {
      const result = engine.evaluateConditions(
        { type: 'ORDER', status: 'PAID', amount: 100 },
        { type: 'ORDER', status: 'PAID', amount: 50 },
      );
      expect(result).toBe(false);
    });
  });
});
