import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebhookStep } from './webhook-step';

describe('WebhookStep', () => {
  let step: WebhookStep;

  const mockContext = {
    triggerData: { orderId: 'ord-1' },
    workflowId: 'wf-1',
    organizationId: 'org-1',
    evaluateConditions: vi.fn(),
  };

  beforeEach(() => {
    step = new WebhookStep();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('execute', () => {
    it('should call fetch with POST by default and return success on 200', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
      } as any);

      const result = await step.execute(
        { type: 'WEBHOOK', config: { url: 'https://example.com/hook' } },
        mockContext,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/hook',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: { url: 'https://example.com/hook' },
            context: { orderId: 'ord-1' },
          }),
        },
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ status: 200 });
    });

    it('should use custom method when provided', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
      } as any);

      await step.execute(
        { type: 'WEBHOOK', config: { url: 'https://example.com/hook', method: 'PUT' } },
        mockContext,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/hook',
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('should include custom headers', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
      } as any);

      await step.execute(
        {
          type: 'WEBHOOK',
          config: {
            url: 'https://example.com/hook',
            headers: { Authorization: 'Bearer token123' },
          },
        },
        mockContext,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/hook',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token123',
          },
        }),
      );
    });

    it('should return success false when response is not ok', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
      } as any);

      const result = await step.execute(
        { type: 'WEBHOOK', config: { url: 'https://example.com/hook' } },
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.data).toEqual({ status: 500 });
    });

    it('should handle 4xx responses', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as any);

      const result = await step.execute(
        { type: 'WEBHOOK', config: { url: 'https://example.com/not-found' } },
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.data).toEqual({ status: 404 });
    });

    it('should catch network errors and return error result', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await step.execute(
        { type: 'WEBHOOK', config: { url: 'https://example.com/hook' } },
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('ECONNREFUSED');
      expect(result.data).toBeUndefined();
    });

    it('should handle fetch throwing non-Error values', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue('Network failure');

      const result = await step.execute(
        { type: 'WEBHOOK', config: { url: 'https://example.com/hook' } },
        mockContext,
      );

      expect(result.success).toBe(false);
    });

    it('should include body with step config and context triggerData', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
      } as any);

      const stepConfig = {
        type: 'WEBHOOK',
        config: { url: 'https://example.com/hook', customField: 'test' },
      };

      await step.execute(stepConfig, mockContext);

      const [, options] = mockFetch.mock.calls[0];
      const parsedBody = JSON.parse(options.body as string);
      expect(parsedBody.step).toEqual({ url: 'https://example.com/hook', customField: 'test' });
      expect(parsedBody.context).toEqual({ orderId: 'ord-1' });
    });

    it('should return status for 2xx responses', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 204,
      } as any);

      const result = await step.execute(
        { type: 'WEBHOOK', config: { url: 'https://example.com/hook' } },
        mockContext,
      );

      expect(result.data?.status).toBe(204);
    });
  });
});
