import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowService } from './workflow.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { NotFoundException } from '@nestjs/common';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let prisma: any;
  let eventBus: any;

  const orgId = 'org-1';

  beforeEach(() => {
    prisma = {
      workflow: {
        create: vi.fn().mockResolvedValue({ id: 'wf-1', name: 'Test Workflow', steps: [] }),
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({ id: 'wf-1' }),
        delete: vi.fn().mockResolvedValue({ id: 'wf-1' }),
      },
      workflowStep: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({ id: 'step-1' }),
      },
    } as any;
    eventBus = { emit: vi.fn() } as any;
    service = new WorkflowService(prisma, eventBus);
  });

  describe('createWorkflow', () => {
    it('should create a workflow with steps', async () => {
      const dto = {
        name: 'Test',
        trigger: 'ORDER_CREATED',
        steps: [{ order: 1, type: 'SEND_EMAIL', config: { channel: 'email' } }],
      };
      const result = await service.createWorkflow(orgId, dto);
      expect(result.id).toBe('wf-1');
      expect(prisma.workflow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: orgId,
            name: 'Test',
            trigger: 'ORDER_CREATED',
            isActive: true,
            conditions: {},
          }),
        }),
      );
    });

    it('should create workflow without steps', async () => {
      const dto = { name: 'Empty', trigger: 'MANUAL' };
      const result = await service.createWorkflow(orgId, dto);
      expect(result.id).toBe('wf-1');
    });

    it('should respect isActive false', async () => {
      const dto = { name: 'Inactive', trigger: 'ORDER_CREATED', isActive: false };
      await service.createWorkflow(orgId, dto);
      expect(prisma.workflow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });

    it('should include conditions when provided', async () => {
      const dto = { name: 'Conditional', trigger: 'ORDER_CREATED', conditions: { minValue: 100 } };
      await service.createWorkflow(orgId, dto);
      expect(prisma.workflow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ conditions: { minValue: 100 } }),
        }),
      );
    });

    it('should create steps with correct order', async () => {
      const dto = {
        name: 'Multi Step',
        trigger: 'ORDER_CREATED',
        steps: [
          { order: 1, type: 'SEND_EMAIL', config: {} },
          { order: 2, type: 'CREATE_TASK', config: {} },
        ],
      };
      await service.createWorkflow(orgId, dto);
      const createCall = prisma.workflow.create.mock.calls[0][0];
      expect(createCall.data.steps.create).toHaveLength(2);
      expect(createCall.data.steps.create[0].order).toBe(1);
      expect(createCall.data.steps.create[1].order).toBe(2);
    });
  });

  describe('getWorkflows', () => {
    it('should return all workflows for org', async () => {
      prisma.workflow.findMany.mockResolvedValue([{ id: 'wf-1' }, { id: 'wf-2' }]);
      const result = await service.getWorkflows(orgId);
      expect(result).toHaveLength(2);
      expect(prisma.workflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should filter by isActive', async () => {
      prisma.workflow.findMany.mockResolvedValue([{ id: 'wf-1', isActive: true }]);
      const result = await service.getWorkflows(orgId, { isActive: true });
      expect(result).toHaveLength(1);
      expect(prisma.workflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
      );
    });

    it('should not include isActive filter when undefined', async () => {
      prisma.workflow.findMany.mockResolvedValue([{ id: 'wf-1' }]);
      await service.getWorkflows(orgId, {});
      const where = prisma.workflow.findMany.mock.calls[0][0].where;
      expect(where.isActive).toBeUndefined();
    });

    it('should include steps ordered by order asc', async () => {
      prisma.workflow.findMany.mockResolvedValue([{ id: 'wf-1', steps: [{ order: 1 }, { order: 2 }] }]);
      const result = await service.getWorkflows(orgId);
      expect(result[0].steps).toHaveLength(2);
      expect(prisma.workflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { steps: { orderBy: { order: 'asc' } } },
        }),
      );
    });
  });

  describe('getWorkflow', () => {
    it('should return single workflow', async () => {
      prisma.workflow.findFirst.mockResolvedValue({ id: 'wf-1', name: 'Test' });
      const result = await service.getWorkflow(orgId, 'wf-1');
      expect(result.id).toBe('wf-1');
      expect(prisma.workflow.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wf-1', organizationId: orgId },
        }),
      );
    });

    it('should throw NotFoundException for missing workflow', async () => {
      prisma.workflow.findFirst.mockResolvedValue(null);
      await expect(service.getWorkflow(orgId, 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateWorkflow', () => {
    it('should throw NotFoundException for missing workflow', async () => {
      prisma.workflow.findFirst.mockResolvedValue(null);
      await expect(service.updateWorkflow(orgId, 'invalid', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('should update workflow and replace steps', async () => {
      prisma.workflow.findFirst.mockResolvedValue({ id: 'wf-1', steps: [{ id: 's-1' }] });
      prisma.workflow.update.mockResolvedValue({ id: 'wf-1', name: 'Updated' });
      prisma.workflow.findFirst.mockResolvedValue({ id: 'wf-1', name: 'Updated', steps: [] });

      await service.updateWorkflow(orgId, 'wf-1', {
        name: 'Updated',
        steps: [{ order: 1, type: 'SEND_EMAIL', config: {} }],
      });
      expect(prisma.workflow.update).toHaveBeenCalled();
      expect(prisma.workflowStep.deleteMany).toHaveBeenCalledWith({ where: { workflowId: 'wf-1' } });
      expect(prisma.workflowStep.create).toHaveBeenCalled();
    });

    it('should update basic fields without replacing steps', async () => {
      prisma.workflow.findFirst.mockResolvedValue({ id: 'wf-1', steps: [{ id: 's-1' }] });
      prisma.workflow.update.mockResolvedValue({ id: 'wf-1', name: 'Renamed' });

      await service.updateWorkflow(orgId, 'wf-1', { name: 'Renamed', trigger: 'NEW_EVENT' });
      expect(prisma.workflow.update).toHaveBeenCalled();
      expect(prisma.workflowStep.deleteMany).not.toHaveBeenCalled();
    });

    it('should update conditions and isActive', async () => {
      prisma.workflow.findFirst.mockResolvedValue({ id: 'wf-1', steps: [] });
      prisma.workflow.update.mockResolvedValue({ id: 'wf-1', isActive: false, conditions: { x: 1 } });

      await service.updateWorkflow(orgId, 'wf-1', { isActive: false, conditions: { segment: 'VIP' } });
      expect(prisma.workflow.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: false, conditions: { segment: 'VIP' } }),
        }),
      );
    });

    it('should create new steps in order', async () => {
      prisma.workflow.findFirst.mockResolvedValue({ id: 'wf-1', steps: [{ id: 's-1' }] });
      prisma.workflow.update.mockResolvedValue({ id: 'wf-1' });
      prisma.workflow.findFirst.mockResolvedValue({ id: 'wf-1', steps: [] });

      await service.updateWorkflow(orgId, 'wf-1', {
        name: 'Test',
        steps: [
          { order: 1, type: 'SEND_EMAIL', config: {} },
          { order: 2, type: 'DELAY', config: { seconds: 10 } },
        ],
      });
      expect(prisma.workflowStep.create).toHaveBeenCalledTimes(2);
      expect(prisma.workflowStep.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ order: 1 }) }),
      );
      expect(prisma.workflowStep.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ order: 2 }) }),
      );
    });
  });

  describe('deleteWorkflow', () => {
    it('should throw NotFoundException for missing workflow', async () => {
      prisma.workflow.findFirst.mockResolvedValue(null);
      await expect(service.deleteWorkflow(orgId, 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('should delete existing workflow and its steps', async () => {
      prisma.workflow.findFirst.mockResolvedValue({ id: 'wf-1' });
      const result = await service.deleteWorkflow(orgId, 'wf-1');
      expect(result).toEqual({ message: 'Workflow removido' });
      expect(prisma.workflowStep.deleteMany).toHaveBeenCalledWith({ where: { workflowId: 'wf-1' } });
      expect(prisma.workflow.delete).toHaveBeenCalledWith({ where: { id: 'wf-1' } });
    });
  });

  describe('toggleWorkflow', () => {
    it('should toggle active to inactive', async () => {
      prisma.workflow.findFirst.mockResolvedValue({ id: 'wf-1', isActive: true });
      prisma.workflow.update.mockResolvedValue({ id: 'wf-1', isActive: false });
      const result = await service.toggleWorkflow(orgId, 'wf-1');
      expect(prisma.workflow.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
      expect(result.isActive).toBe(false);
    });

    it('should toggle inactive to active', async () => {
      prisma.workflow.findFirst.mockResolvedValue({ id: 'wf-1', isActive: false });
      prisma.workflow.update.mockResolvedValue({ id: 'wf-1', isActive: true });
      const result = await service.toggleWorkflow(orgId, 'wf-1');
      expect(prisma.workflow.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: true } }),
      );
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException for missing workflow', async () => {
      prisma.workflow.findFirst.mockResolvedValue(null);
      await expect(service.toggleWorkflow(orgId, 'invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
