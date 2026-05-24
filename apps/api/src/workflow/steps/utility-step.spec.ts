import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UtilityStep } from './utility-step';

describe('UtilityStep', () => {
  let step: UtilityStep;

  const evaluateConditions = vi.fn();
  const mockContext = {
    triggerData: { amount: 150 },
    workflowId: 'wf-1',
    organizationId: 'org-1',
    evaluateConditions,
  };

  beforeEach(() => {
    step = new UtilityStep();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('DELAY', () => {
    it('should resolve successfully after delay', async () => {
      const resultPromise = step.execute(
        { type: 'DELAY', config: { seconds: 1 } },
        mockContext,
      );

      vi.advanceTimersByTime(1000);

      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('should cap delay at 5000ms for MVP', async () => {
      const resultPromise = step.execute(
        { type: 'DELAY', config: { seconds: 10 } },
        mockContext,
      );

      vi.advanceTimersByTime(5000);

      const result = await resultPromise;
      expect(result.success).toBe(true);
    });

    it('should use default of 60 seconds when seconds not provided', async () => {
      const resultPromise = step.execute(
        { type: 'DELAY', config: {} },
        mockContext,
      );

      vi.advanceTimersByTime(5000);

      const result = await resultPromise;
      expect(result.success).toBe(true);
    });

    it('should default to 60s when seconds is 0 (falsy)', async () => {
      const resultPromise = step.execute(
        { type: 'DELAY', config: { seconds: 0 } },
        mockContext,
      );

      vi.advanceTimersByTime(5000);

      const result = await resultPromise;
      expect(result.success).toBe(true);
    });
  });

  describe('CONDITION', () => {
    it('should return success with conditionMet true when conditions pass', async () => {
      evaluateConditions.mockReturnValue(true);

      const result = await step.execute(
        {
          type: 'CONDITION',
          config: { field: 'amount', operator: 'gt', value: 100 },
        },
        mockContext,
      );

      expect(evaluateConditions).toHaveBeenCalledWith(
        { field: 'amount', operator: 'gt', value: 100 },
        { amount: 150 },
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ conditionMet: true });
    });

    it('should return success with conditionMet false when conditions fail', async () => {
      evaluateConditions.mockReturnValue(false);

      const result = await step.execute(
        { type: 'CONDITION', config: { field: 'amount', operator: 'lt', value: 100 } },
        mockContext,
      );

      expect(result.data).toEqual({ conditionMet: false });
    });
  });

  describe('unknown type', () => {
    it('should return error for unknown utility step type', async () => {
      const result = await step.execute(
        { type: 'CALCULATE', config: {} },
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown utility step type: CALCULATE');
    });
  });
});
