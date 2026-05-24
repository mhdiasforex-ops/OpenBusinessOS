import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RhController } from './rh.controller';

describe('RhController', () => {
  let controller: RhController;
  let service: any;

  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    service = {
      getDashboard: vi.fn().mockResolvedValue({ totalEmployees: 10 }),
      createEmployee: vi.fn().mockResolvedValue({ id: 'emp-1' }),
      getEmployees: vi.fn().mockResolvedValue({ items: [] }),
      getEmployee: vi.fn().mockResolvedValue({ id: 'emp-1' }),
      updateEmployee: vi.fn().mockResolvedValue({ id: 'emp-1' }),
      deleteEmployee: vi.fn().mockResolvedValue({ success: true }),
      createTimeEntry: vi.fn().mockResolvedValue({ id: 'te-1' }),
      getTimeEntries: vi.fn().mockResolvedValue({ items: [] }),
      createPayroll: vi.fn().mockResolvedValue({ id: 'pr-1' }),
      getPayrolls: vi.fn().mockResolvedValue({ items: [] }),
      createLeaveRequest: vi.fn().mockResolvedValue({ id: 'lr-1' }),
      getLeaveRequests: vi.fn().mockResolvedValue({ items: [] }),
      approveLeaveRequest: vi.fn().mockResolvedValue({ id: 'lr-1', status: 'APPROVED' }),
      rejectLeaveRequest: vi.fn().mockResolvedValue({ id: 'lr-1', status: 'REJECTED' }),
    };
    controller = new RhController(service);
  });

  it('should get dashboard', async () => {
    const result = await controller.getDashboard(req);
    expect(result).toEqual({ totalEmployees: 10 });
    expect(service.getDashboard).toHaveBeenCalledWith('org-123');
  });

  it('should create employee', async () => {
    const dto = { name: 'John' } as any;
    const result = await controller.createEmployee(req, dto);
    expect(result).toEqual({ id: 'emp-1' });
    expect(service.createEmployee).toHaveBeenCalledWith('org-123', dto);
  });

  it('should list employees', async () => {
    const filters = { department: 'Tech' };
    const result = await controller.getEmployees(req, filters);
    expect(result).toEqual({ items: [] });
    expect(service.getEmployees).toHaveBeenCalledWith('org-123', filters);
  });

  it('should get employee by id', async () => {
    const result = await controller.getEmployee(req, 'emp-1');
    expect(result).toEqual({ id: 'emp-1' });
    expect(service.getEmployee).toHaveBeenCalledWith('org-123', 'emp-1');
  });

  it('should update employee', async () => {
    const dto = { name: 'Jane' } as any;
    const result = await controller.updateEmployee(req, 'emp-1', dto);
    expect(result).toEqual({ id: 'emp-1' });
    expect(service.updateEmployee).toHaveBeenCalledWith('org-123', 'emp-1', dto);
  });

  it('should delete employee', async () => {
    const result = await controller.deleteEmployee(req, 'emp-1');
    expect(result).toEqual({ success: true });
    expect(service.deleteEmployee).toHaveBeenCalledWith('org-123', 'emp-1');
  });

  it('should create time entry', async () => {
    const dto = { date: '2024-06-15' } as any;
    const result = await controller.createTimeEntry(req, 'emp-1', dto);
    expect(result).toEqual({ id: 'te-1' });
    expect(service.createTimeEntry).toHaveBeenCalledWith('org-123', 'emp-1', dto);
  });

  it('should list time entries', async () => {
    const filters = { month: 6 };
    const result = await controller.getTimeEntries(req, 'emp-1', filters);
    expect(result).toEqual({ items: [] });
    expect(service.getTimeEntries).toHaveBeenCalledWith('org-123', 'emp-1', filters);
  });

  it('should create payroll', async () => {
    const dto = { month: 6, year: 2024 } as any;
    const result = await controller.createPayroll(req, 'emp-1', dto);
    expect(result).toEqual({ id: 'pr-1' });
    expect(service.createPayroll).toHaveBeenCalledWith('org-123', 'emp-1', dto);
  });

  it('should list payrolls', async () => {
    const result = await controller.getPayrolls(req, 'emp-1');
    expect(result).toEqual({ items: [] });
    expect(service.getPayrolls).toHaveBeenCalledWith('org-123', 'emp-1');
  });

  it('should create leave request', async () => {
    const dto = { type: 'VACATION' } as any;
    const result = await controller.createLeaveRequest(req, 'emp-1', dto);
    expect(result).toEqual({ id: 'lr-1' });
    expect(service.createLeaveRequest).toHaveBeenCalledWith('org-123', 'emp-1', dto);
  });

  it('should list leave requests', async () => {
    const result = await controller.getLeaveRequests(req, 'emp-1');
    expect(result).toEqual({ items: [] });
    expect(service.getLeaveRequests).toHaveBeenCalledWith('org-123', 'emp-1');
  });

  it('should approve leave request', async () => {
    const result = await controller.approveLeaveRequest(req, 'lr-1');
    expect(result).toEqual({ id: 'lr-1', status: 'APPROVED' });
    expect(service.approveLeaveRequest).toHaveBeenCalledWith('org-123', 'lr-1', 'user-1');
  });

  it('should reject leave request', async () => {
    const result = await controller.rejectLeaveRequest(req, 'lr-1');
    expect(result).toEqual({ id: 'lr-1', status: 'REJECTED' });
    expect(service.rejectLeaveRequest).toHaveBeenCalledWith('org-123', 'lr-1', 'user-1');
  });
});
