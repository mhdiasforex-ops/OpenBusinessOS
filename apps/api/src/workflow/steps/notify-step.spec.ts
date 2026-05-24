import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotifyStep } from './notify-step';

describe('NotifyStep', () => {
  let step: NotifyStep;

  const mockContext = {
    triggerData: {},
    workflowId: 'wf-1',
    organizationId: 'org-1',
    evaluateConditions: vi.fn(),
  };

  beforeEach(() => {
    step = new NotifyStep();
  });

  describe('execute', () => {
    describe('SEND_EMAIL', () => {
      it('should return success with email_sent data', async () => {
        const result = await step.execute(
          { type: 'SEND_EMAIL', config: { to: 'user@test.com', subject: 'Welcome', body: 'Hello!' } },
          mockContext,
        );

        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          action: 'email_sent',
          to: 'user@test.com',
          subject: 'Welcome',
        });
      });

      it('should work with minimal config', async () => {
        const result = await step.execute(
          { type: 'SEND_EMAIL', config: {} },
          mockContext,
        );
        expect(result.success).toBe(true);
        expect(result.data?.to).toBeUndefined();
      });
    });

    describe('SEND_WHATSAPP', () => {
      it('should return success with whatsapp_sent data', async () => {
        const result = await step.execute(
          { type: 'SEND_WHATSAPP', config: { to: '+5511999999999', message: 'Hello' } },
          mockContext,
        );

        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          action: 'whatsapp_sent',
          to: '+5511999999999',
        });
      });

      it('should work with minimal config', async () => {
        const result = await step.execute(
          { type: 'SEND_WHATSAPP', config: {} },
          mockContext,
        );
        expect(result.success).toBe(true);
        expect(result.data?.to).toBeUndefined();
      });
    });

    describe('unknown type', () => {
      it('should return error for unknown notify step type', async () => {
        const result = await step.execute(
          { type: 'SEND_SMS', config: { to: '+5511' } },
          mockContext,
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown notify step type: SEND_SMS');
      });
    });
  });
});
