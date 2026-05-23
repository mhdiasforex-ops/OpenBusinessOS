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
      const dto = { name: 'Test', trigger: 'ORDER_CREATED', steps: [{ order: 1, type: 'SEND_EMAIL', config: { channel: 'email' } }] };
      const result = await service.createWorkflow(orgId, dto);
      expect(prisma.workflow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ organizationId: orgId, name: 'Test' }),
        }),
      );
    });

    it('should create workflow without steps', async () => {
      const dto = { name: 'Empty', trigger: 'MANUAL' };
      const result = await service.createWorkflow(orgId, dto);
      expect(result.id).toBe('wf-1');
    });
  });

  describe('getWorkflows', () => {
    it('should return all workflows for org', async () => {
      prisma.workflow.findMany.mockResolvedValue([{ id: 'wf-1' }, { id: 'wf-2' }]);
      const result = await service.getWorkflows(orgId);
      expect(result).toHaveLength(2);
    });

    it('should filter by isActive', async () => {
      prisma.workflow.findMany.mockResolvedValue([{ id: 'wf-1', isActive: true }]);
      const result = await service.getWorkflows(orgId, { isActive: true });
      expect(prisma.workflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
      );
    });
  });

  describe('getWorkflow', () => {
    it('should return single workflow', async () => {
      prisma.workflow.findFirst.mockResolvedValue({ id: 'wf-1', name: 'Test' });
      const result = await service.getWorkflow(orgId, 'wf-1');
      expect(result.id).toBe('wf-1');
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

      await service.updateWorkflow(orgId, 'wf-1', {
        name: 'Updated',
        steps: [{ order: 1, type: 'SEND_EMAIL', config: {} }],
      });
      expect(prisma.workflow.update).toHaveBeenCalled();
      expect(prisma.workflowStep.deleteMany).toHaveBeenCalled();
      expect(prisma.workflowStep.create).toHaveBeenCalled();
    });
  });

  describe('deleteWorkflow', () => {
    it('should throw NotFoundException for missing workflow', async () => {
      prisma.workflow.findFirst.mockResolvedValue(null);
      await expect(service.deleteWorkflow(orgId, 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('should delete existing workflow', async () => {
      prisma.workflow.findFirst.mockResolvedValue({ id: 'wf-1' });
      await service.deleteWorkflow(orgId, 'wf-1');
      expect(prisma.workflow.delete).toHaveBeenCalledWith({ where: { id: 'wf-1' } });
    });
  });
});
