import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { ExecutionLogService } from './execution-log.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExecutionLogService', () => {
  let service: ExecutionLogService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      event: {
        create: vi.fn().mockResolvedValue({ id: 'evt-1' }),
        findMany: vi.fn(),
      },
    } as any;
    service = new ExecutionLogService(prisma);
  });

  describe('startExecution', () => {
    it('should create a new execution entry and return executionId', () => {
      vi.useFakeTimers();
      const executionId = service.startExecution('wf-1', 'org-1', { orderId: '123' });
      vi.useRealTimers();

      expect(executionId).toContain('exec_');
      expect(executionId).toContain('wf-1');
      expect(typeof executionId).toBe('string');
    });

    it('should store the entry in memory', () => {
      const executionId = service.startExecution('wf-1', 'org-1', { orderId: '123' });
      const entry = service.getExecution(executionId);

      expect(entry).toBeDefined();
      expect(entry!.workflowId).toBe('wf-1');
      expect(entry!.organizationId).toBe('org-1');
      expect(entry!.triggerData).toEqual({ orderId: '123' });
      expect(entry!.status).toBe('RUNNING');
      expect(entry!.steps).toEqual([]);
      expect(entry!.startTime).toBeGreaterThan(0);
    });

    it('should generate unique execution IDs', () => {
      vi.useFakeTimers();
      const id1 = service.startExecution('wf-1', 'org-1', {});
      vi.advanceTimersByTime(1);
      const id2 = service.startExecution('wf-1', 'org-1', {});
      vi.useRealTimers();
      expect(id1).not.toBe(id2);
    });
  });

  describe('logStep', () => {
    it('should add a step log entry to an active execution', () => {
      const executionId = service.startExecution('wf-1', 'org-1', {});
      service.logStep(executionId, 1, 'SEND_EMAIL', true, { sent: true });

      const entry = service.getExecution(executionId);
      expect(entry!.steps).toHaveLength(1);
      expect(entry!.steps[0]).toMatchObject({
        stepOrder: 1,
        stepType: 'SEND_EMAIL',
        success: true,
        data: { sent: true },
      });
      expect(entry!.steps[0].timestamp).toBeGreaterThan(0);
    });

    it('should log multiple steps in order', () => {
      const executionId = service.startExecution('wf-1', 'org-1', {});
      service.logStep(executionId, 1, 'SEND_EMAIL', true);
      service.logStep(executionId, 2, 'CREATE_TASK', true);
      service.logStep(executionId, 3, 'DELAY', true);

      const entry = service.getExecution(executionId);
      expect(entry!.steps).toHaveLength(3);
      expect(entry!.steps[0].stepOrder).toBe(1);
      expect(entry!.steps[2].stepOrder).toBe(3);
    });

    it('should log a failed step with error', () => {
      const executionId = service.startExecution('wf-1', 'org-1', {});
      service.logStep(executionId, 1, 'WEBHOOK', false, undefined, 'HTTP 500');

      const entry = service.getExecution(executionId);
      expect(entry!.steps[0].success).toBe(false);
      expect(entry!.steps[0].error).toBe('HTTP 500');
    });

    it('should not throw when execution ID does not exist', () => {
      expect(() => {
        service.logStep('nonexistent', 1, 'SEND_EMAIL', true);
      }).not.toThrow();
    });
  });

  describe('completeExecution', () => {
    it('should mark execution as COMPLETED and persist', async () => {
      const executionId = service.startExecution('wf-1', 'org-1', { orderId: '123' });

      await service.completeExecution(executionId);

      expect(prisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-1',
            type: 'WORKFLOW_EXECUTION_LOG',
            payload: expect.objectContaining({
              executionId,
              workflowId: 'wf-1',
              status: 'COMPLETED',
            }),
          }),
        }),
      );
    });

    it('should remove execution from memory after completion', async () => {
      const executionId = service.startExecution('wf-1', 'org-1', {});
      await service.completeExecution(executionId);
      expect(service.getExecution(executionId)).toBeUndefined();
    });

    it('should not throw for nonexistent execution', async () => {
      await expect(service.completeExecution('nonexistent')).resolves.toBeUndefined();
    });

    it('should calculate duration', async () => {
      const startTime = Date.now();
      const executionId = service.startExecution('wf-1', 'org-1', {});

      // Manually patch the entry to simulate elapsed time
      const entry = service.getExecution(executionId)!;
      entry.startTime = startTime - 500;

      await service.completeExecution(executionId);
      const createCall = prisma.event.create.mock.calls[0][0];
      expect(createCall.data.payload.duration).toBeGreaterThanOrEqual(490);
      expect(createCall.data.payload.duration).toBeGreaterThan(0);
    });
  });

  describe('failExecution', () => {
    it('should mark execution as FAILED and persist', async () => {
      const executionId = service.startExecution('wf-1', 'org-1', { orderId: '123' });

      await service.failExecution(executionId, 'Something went wrong');

      expect(prisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-1',
            type: 'WORKFLOW_EXECUTION_LOG',
            payload: expect.objectContaining({
              executionId,
              workflowId: 'wf-1',
              status: 'FAILED',
              error: 'Something went wrong',
            }),
          }),
        }),
      );
    });

    it('should remove execution from memory after failure', async () => {
      const executionId = service.startExecution('wf-1', 'org-1', {});
      await service.failExecution(executionId, 'error');
      expect(service.getExecution(executionId)).toBeUndefined();
    });

    it('should not throw for nonexistent execution', async () => {
      await expect(service.failExecution('nonexistent', 'error')).resolves.toBeUndefined();
    });

    it('should calculate duration on failure', async () => {
      const executionId = service.startExecution('wf-1', 'org-1', {});
      const entry = service.getExecution(executionId)!;
      entry.startTime = Date.now() - 1000;

      await service.failExecution(executionId, 'Timeout');
      expect(prisma.event.create.mock.calls[0][0].data.payload.duration).toBeGreaterThanOrEqual(990);
    });
  });

  describe('getExecution', () => {
    it('should return execution entry for valid ID', () => {
      const executionId = service.startExecution('wf-1', 'org-1', {});
      const entry = service.getExecution(executionId);
      expect(entry).toBeDefined();
      expect(entry!.executionId).toBe(executionId);
    });

    it('should return undefined for unknown ID', () => {
      expect(service.getExecution('nonexistent')).toBeUndefined();
    });

    it('should return undefined after execution is completed and removed', async () => {
      const executionId = service.startExecution('wf-1', 'org-1', {});
      await service.completeExecution(executionId);
      expect(service.getExecution(executionId)).toBeUndefined();
    });
  });

  describe('persistLog (via complete/fail)', () => {
    it('should include steps in persisted payload', async () => {
      const executionId = service.startExecution('wf-1', 'org-1', {});
      service.logStep(executionId, 1, 'SEND_EMAIL', true, { sent: true });
      service.logStep(executionId, 2, 'CREATE_TASK', true, { taskId: 't-1' });

      await service.completeExecution(executionId);

      expect(prisma.event.create.mock.calls[0][0].data.payload.steps).toHaveLength(2);
      expect(prisma.event.create.mock.calls[0][0].data.payload.steps[0].stepType).toBe('SEND_EMAIL');
    });

    it('should handle prisma persistence failure gracefully', async () => {
      prisma.event.create.mockRejectedValue(new Error('DB connection lost'));

      const executionId = service.startExecution('wf-1', 'org-1', {});
      await expect(service.completeExecution(executionId)).resolves.toBeUndefined();
    });

    it('should still remove from memory even if persistence fails', async () => {
      prisma.event.create.mockRejectedValue(new Error('DB error'));

      const executionId = service.startExecution('wf-1', 'org-1', {});
      await service.completeExecution(executionId);
      expect(service.getExecution(executionId)).toBeUndefined();
    });

    it('should include triggerData in persisted payload', async () => {
      const executionId = service.startExecution('wf-1', 'org-1', { orderId: 'O-123', amount: 99.9 });

      await service.completeExecution(executionId);

      expect(prisma.event.create.mock.calls[0][0].data.payload.triggerData).toEqual({
        orderId: 'O-123',
        amount: 99.9,
      });
    });
  });
});
