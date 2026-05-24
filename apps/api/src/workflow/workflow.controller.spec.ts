import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowController } from './workflow.controller';

describe('WorkflowController', () => {
  let controller: WorkflowController;
  let service: any;

  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    service = {
      createWorkflow: vi.fn().mockResolvedValue({ id: 'wf-1' }),
      getWorkflows: vi.fn().mockResolvedValue({ items: [] }),
      getWorkflow: vi.fn().mockResolvedValue({ id: 'wf-1' }),
      updateWorkflow: vi.fn().mockResolvedValue({ id: 'wf-1' }),
      deleteWorkflow: vi.fn().mockResolvedValue({ success: true }),
      toggleWorkflow: vi.fn().mockResolvedValue({ id: 'wf-1', isActive: false }),
    };
    controller = new WorkflowController(service);
  });

  it('should create workflow', async () => {
    const dto = { name: 'Onboarding', trigger: 'CUSTOMER_CREATED' } as any;
    const result = await controller.createWorkflow(req, dto);
    expect(result).toEqual({ id: 'wf-1' });
    expect(service.createWorkflow).toHaveBeenCalledWith('org-123', dto);
  });

  it('should list workflows', async () => {
    const result = await controller.getWorkflows(req);
    expect(result).toEqual({ items: [] });
    expect(service.getWorkflows).toHaveBeenCalledWith('org-123');
  });

  it('should get workflow by id', async () => {
    const result = await controller.getWorkflow(req, 'wf-1');
    expect(result).toEqual({ id: 'wf-1' });
    expect(service.getWorkflow).toHaveBeenCalledWith('org-123', 'wf-1');
  });

  it('should update workflow', async () => {
    const dto = { name: 'Updated' } as any;
    const result = await controller.updateWorkflow(req, 'wf-1', dto);
    expect(result).toEqual({ id: 'wf-1' });
    expect(service.updateWorkflow).toHaveBeenCalledWith('org-123', 'wf-1', dto);
  });

  it('should delete workflow', async () => {
    const result = await controller.deleteWorkflow(req, 'wf-1');
    expect(result).toEqual({ success: true });
    expect(service.deleteWorkflow).toHaveBeenCalledWith('org-123', 'wf-1');
  });

  it('should toggle workflow', async () => {
    const result = await controller.toggleWorkflow(req, 'wf-1');
    expect(result).toEqual({ id: 'wf-1', isActive: false });
    expect(service.toggleWorkflow).toHaveBeenCalledWith('org-123', 'wf-1');
  });
});
