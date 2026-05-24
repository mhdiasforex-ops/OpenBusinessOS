import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowExecutorService } from './workflow-executor.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowEngine } from './engine';
import { EventTypes } from '@openbusinessos/event-definitions';

describe('WorkflowExecutorService', () => {
  let service: WorkflowExecutorService;
  let eventEmitter: any;
  let prisma: any;
  let engine: any;

  beforeEach(() => {
    eventEmitter = { on: vi.fn() };
    prisma = {
      workflow: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as any;
    engine = {
      executeWorkflow: vi.fn().mockResolvedValue('exec_123'),
    };
    service = new WorkflowExecutorService(eventEmitter, prisma, engine);
  });

  describe('onModuleInit', () => {
    it('should subscribe to all EventTypes', () => {
      service.onModuleInit();

      const eventTypeValues = Object.values(EventTypes);
      expect(eventEmitter.on).toHaveBeenCalledTimes(eventTypeValues.length);
      eventTypeValues.forEach((eventType) => {
        expect(eventEmitter.on).toHaveBeenCalledWith(eventType, expect.any(Function));
      });
    });

    it('should register async handler for each event', () => {
      service.onModuleInit();

      const handler = eventEmitter.on.mock.calls[0][1];
      expect(handler).toBeInstanceOf(Function);
      // Should be async
      const result = handler({});
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('processTrigger', () => {
    it('should return early if payload has no organizationId', async () => {
      await service.processTrigger('ORDER_CREATED', {});

      expect(prisma.workflow.findMany).not.toHaveBeenCalled();
      expect(engine.executeWorkflow).not.toHaveBeenCalled();
    });

    it('should return early if organizationId is null', async () => {
      await service.processTrigger('ORDER_CREATED', { organizationId: null });

      expect(prisma.workflow.findMany).not.toHaveBeenCalled();
      expect(engine.executeWorkflow).not.toHaveBeenCalled();
    });

    it('should query active workflows matching the trigger and org', async () => {
      await service.processTrigger('ORDER_CREATED', { organizationId: 'org-1' });

      expect(prisma.workflow.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          trigger: 'ORDER_CREATED',
          isActive: true,
        },
        include: { steps: { orderBy: { order: 'asc' } } },
      });
    });

    it('should execute engine for each matching workflow', async () => {
      const workflows = [
        { id: 'wf-1', name: 'Workflow 1', steps: [] },
        { id: 'wf-2', name: 'Workflow 2', steps: [] },
      ];
      prisma.workflow.findMany.mockResolvedValue(workflows);

      await service.processTrigger('ORDER_CREATED', { organizationId: 'org-1' });

      expect(engine.executeWorkflow).toHaveBeenCalledTimes(2);
      expect(engine.executeWorkflow).toHaveBeenCalledWith(workflows[0], { organizationId: 'org-1' });
      expect(engine.executeWorkflow).toHaveBeenCalledWith(workflows[1], { organizationId: 'org-1' });
    });

    it('should not execute engine when no workflows match', async () => {
      prisma.workflow.findMany.mockResolvedValue([]);

      await service.processTrigger('UNKNOWN_EVENT', { organizationId: 'org-1' });

      expect(engine.executeWorkflow).not.toHaveBeenCalled();
    });

    it('should propagate error when engine.executeWorkflow throws', async () => {
      const workflows = [
        { id: 'wf-1', name: 'Workflow 1', steps: [] },
      ];
      prisma.workflow.findMany.mockResolvedValue(workflows);
      engine.executeWorkflow.mockRejectedValue(new Error('Engine error'));

      await expect(
        service.processTrigger('ORDER_CREATED', { organizationId: 'org-1' }),
      ).rejects.toThrow('Engine error');
    });

    it('should pass the full payload as trigger data to engine', async () => {
      prisma.workflow.findMany.mockResolvedValue([
        { id: 'wf-1', name: 'Workflow 1', steps: [] },
      ]);
      const payload = { organizationId: 'org-1', customerId: 'c-1', amount: 250 };

      await service.processTrigger('TRANSACTION_PAID', payload);

      expect(engine.executeWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'wf-1' }),
        payload,
      );
    });
  });
});
