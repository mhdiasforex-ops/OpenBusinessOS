import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StepHandlerRegistry } from './index';
import { NotifyStep } from './notify-step';
import { TaskStep } from './task-step';
import { WebhookStep } from './webhook-step';
import { AiStep } from './ai-step';
import { UtilityStep } from './utility-step';

describe('StepHandlerRegistry', () => {
  let registry: StepHandlerRegistry;
  let notifyStep: NotifyStep;
  let taskStep: TaskStep;
  let webhookStep: WebhookStep;
  let aiStep: AiStep;
  let utilityStep: UtilityStep;

  const mockContext = {
    triggerData: {},
    workflowId: 'wf-1',
    organizationId: 'org-1',
    evaluateConditions: vi.fn(),
  };

  beforeEach(() => {
    notifyStep = new NotifyStep();
    taskStep = new TaskStep();
    webhookStep = new WebhookStep();
    aiStep = new AiStep();
    utilityStep = new UtilityStep();

    registry = new StepHandlerRegistry(notifyStep, taskStep, webhookStep, aiStep, utilityStep);
  });

  describe('constructor', () => {
    it('should register all step handlers', () => {
      expect(registry.hasHandler('SEND_EMAIL')).toBe(true);
      expect(registry.hasHandler('SEND_WHATSAPP')).toBe(true);
      expect(registry.hasHandler('CREATE_TASK')).toBe(true);
      expect(registry.hasHandler('UPDATE_STATUS')).toBe(true);
      expect(registry.hasHandler('WEBHOOK')).toBe(true);
      expect(registry.hasHandler('AI_ACTION')).toBe(true);
      expect(registry.hasHandler('DELAY')).toBe(true);
      expect(registry.hasHandler('CONDITION')).toBe(true);
    });
  });

  describe('register', () => {
    it('should register a new handler for a given type', () => {
      const mockHandler = { execute: vi.fn() };
      registry.register('CUSTOM_TYPE', mockHandler);
      expect(registry.hasHandler('CUSTOM_TYPE')).toBe(true);
      expect(registry.getHandler('CUSTOM_TYPE')).toBe(mockHandler);
    });

    it('should overwrite an existing handler', () => {
      const handler1 = { execute: vi.fn() };
      const handler2 = { execute: vi.fn() };
      registry.register('SEND_EMAIL', handler1);
      registry.register('SEND_EMAIL', handler2);
      expect(registry.getHandler('SEND_EMAIL')).toBe(handler2);
    });
  });

  describe('getHandler', () => {
    it('should return the handler for a known type', () => {
      const handler = registry.getHandler('WEBHOOK');
      expect(handler).toBe(webhookStep);
    });

    it('should return undefined for an unknown type', () => {
      expect(registry.getHandler('UNKNOWN')).toBeUndefined();
    });
  });

  describe('hasHandler', () => {
    it('should return true for a registered type', () => {
      expect(registry.hasHandler('AI_ACTION')).toBe(true);
    });

    it('should return false for an unregistered type', () => {
      expect(registry.hasHandler('UNKNOWN')).toBe(false);
    });
  });

  describe('execute', () => {
    it('should delegate execution to the correct handler for SEND_EMAIL', async () => {
      const step = { type: 'SEND_EMAIL', config: { to: 'test@test.com', subject: 'Hello' } };
      const result = await registry.execute(step, mockContext);
      expect(result.success).toBe(true);
      expect(result.data?.action).toBe('email_sent');
    });

    it('should delegate execution to the correct handler for SEND_WHATSAPP', async () => {
      const step = { type: 'SEND_WHATSAPP', config: { to: '+5511999999999' } };
      const result = await registry.execute(step, mockContext);
      expect(result.success).toBe(true);
    });

    it('should delegate execution to the correct handler for CREATE_TASK', async () => {
      const step = { type: 'CREATE_TASK', config: { title: 'New task' } };
      const result = await registry.execute(step, mockContext);
      expect(result.success).toBe(true);
    });

    it('should delegate execution to the correct handler for UPDATE_STATUS', async () => {
      const step = { type: 'UPDATE_STATUS', config: { entity: 'order', newStatus: 'shipped' } };
      const result = await registry.execute(step, mockContext);
      expect(result.success).toBe(true);
    });

    it('should delegate execution to the correct handler for WEBHOOK', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200 } as any);
      const step = { type: 'WEBHOOK', config: { url: 'https://example.com/hook' } };
      const result = await registry.execute(step, mockContext);
      expect(result.success).toBe(true);
      vi.restoreAllMocks();
    });

    it('should delegate execution to the correct handler for AI_ACTION', async () => {
      const step = { type: 'AI_ACTION', config: { prompt: 'Analyze data' } };
      const result = await registry.execute(step, mockContext);
      expect(result.success).toBe(true);
    });

    it('should delegate execution to the correct handler for DELAY', async () => {
      const step = { type: 'DELAY', config: { seconds: 0 } };
      const result = await registry.execute(step, mockContext);
      expect(result.success).toBe(true);
    });

    it('should delegate execution to CONDITION handler', async () => {
      const step = { type: 'CONDITION', config: { field: 'value' } };
      const result = await registry.execute(step, mockContext);
      expect(result.success).toBe(true);
    });

    it('should return error result for unknown step type', async () => {
      const step = { type: 'NONEXISTENT', config: {} };
      const result = await registry.execute(step, mockContext);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown step type: NONEXISTENT');
    });

    it('should return error result when step type is missing', async () => {
      const step = { config: {} };
      const result = await registry.execute(step as any, mockContext);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown step type');
    });
  });
});
