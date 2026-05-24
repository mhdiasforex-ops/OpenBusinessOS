import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskStep } from './task-step';

describe('TaskStep', () => {
  let step: TaskStep;

  const mockContext = {
    triggerData: {},
    workflowId: 'wf-1',
    organizationId: 'org-1',
    evaluateConditions: vi.fn(),
  };

  beforeEach(() => {
    step = new TaskStep();
  });

  describe('execute', () => {
    describe('CREATE_TASK', () => {
      it('should return success with task_created data', async () => {
        const result = await step.execute(
          { type: 'CREATE_TASK', config: { title: 'Follow up', assignee: 'user-1', dueDate: '2026-06-15' } },
          mockContext,
        );

        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          action: 'task_created',
          title: 'Follow up',
        });
      });

      it('should work with minimal config', async () => {
        const result = await step.execute(
          { type: 'CREATE_TASK', config: { title: '' } },
          mockContext,
        );
        expect(result.success).toBe(true);
        expect(result.data?.title).toBe('');
      });
    });

    describe('UPDATE_STATUS', () => {
      it('should return success with status_updated data', async () => {
        const result = await step.execute(
          { type: 'UPDATE_STATUS', config: { entity: 'order-1', newStatus: 'shipped' } },
          mockContext,
        );

        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          action: 'status_updated',
          entity: 'order-1',
          newStatus: 'shipped',
        });
      });

      it('should work with minimal config', async () => {
        const result = await step.execute(
          { type: 'UPDATE_STATUS', config: {} },
          mockContext,
        );
        expect(result.success).toBe(true);
        expect(result.data?.entity).toBeUndefined();
      });
    });

    describe('unknown type', () => {
      it('should return error for unknown task step type', async () => {
        const result = await step.execute(
          { type: 'ASSIGN_TASK', config: {} },
          mockContext,
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown task step type: ASSIGN_TASK');
      });
    });
  });
});
