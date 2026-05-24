import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiStep } from './ai-step';

describe('AiStep', () => {
  let step: AiStep;

  const mockContext = {
    triggerData: { orderId: 'ord-1' },
    workflowId: 'wf-1',
    organizationId: 'org-1',
    evaluateConditions: vi.fn(),
  };

  beforeEach(() => {
    step = new AiStep();
  });

  describe('execute', () => {
    it('should return success with ai_action data', async () => {
      const result = await step.execute(
        { type: 'AI_ACTION', config: { prompt: 'Analyze this data' } },
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        action: 'ai_action',
        prompt: 'Analyze this data',
      });
    });

    it('should work with minimal config', async () => {
      const result = await step.execute(
        { type: 'AI_ACTION', config: { prompt: '' } },
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(result.data?.prompt).toBe('');
    });

    it('should not depend on context data', async () => {
      const result = await step.execute(
        { type: 'AI_ACTION', config: { prompt: 'Test' } },
        {} as any,
      );

      expect(result.success).toBe(true);
    });
  });
});
