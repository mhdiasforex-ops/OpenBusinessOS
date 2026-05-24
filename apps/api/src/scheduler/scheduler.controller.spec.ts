import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchedulerController } from './scheduler.controller';

describe('SchedulerController', () => {
  let controller: SchedulerController;
  let service: any;

  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    service = {
      createAppointment: vi.fn().mockResolvedValue({ id: 'apt-1' }),
      getAppointments: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      getAppointment: vi.fn().mockResolvedValue({ id: 'apt-1' }),
      updateAppointment: vi.fn().mockResolvedValue({ id: 'apt-1' }),
      deleteAppointment: vi.fn().mockResolvedValue({ success: true }),
      getAppointmentsByPeriod: vi.fn().mockResolvedValue({ items: [] }),
      confirmAppointment: vi.fn().mockResolvedValue({ id: 'apt-1', status: 'CONFIRMED' }),
      cancelAppointment: vi.fn().mockResolvedValue({ id: 'apt-1', status: 'CANCELLED' }),
      getCountByStatus: vi.fn().mockResolvedValue({ SCHEDULED: 5, CONFIRMED: 3 }),
      getPendingReminders: vi.fn().mockResolvedValue({ items: [] }),
      markReminderSent: vi.fn().mockResolvedValue({ id: 'apt-1', reminderSent: true }),
    };
    controller = new SchedulerController(service);
  });

  it('should create appointment', async () => {
    const dto = { title: 'Consulta', startsAt: '2026-06-01T09:00:00Z' } as any;
    const result = await controller.createAppointment(req, dto);
    expect(result).toEqual({ id: 'apt-1' });
    expect(service.createAppointment).toHaveBeenCalledWith('org-123', dto, 'user-1');
  });

  it('should list appointments', async () => {
    const query = { page: 1 } as any;
    const result = await controller.getAppointments(req, query);
    expect(result).toEqual({ items: [], total: 0 });
    expect(service.getAppointments).toHaveBeenCalledWith('org-123', query);
  });

  it('should get appointment by id', async () => {
    const result = await controller.getAppointment(req, 'apt-1');
    expect(result).toEqual({ id: 'apt-1' });
    expect(service.getAppointment).toHaveBeenCalledWith('org-123', 'apt-1');
  });

  it('should update appointment', async () => {
    const dto = { title: 'Retorno' } as any;
    const result = await controller.updateAppointment(req, 'apt-1', dto);
    expect(result).toEqual({ id: 'apt-1' });
    expect(service.updateAppointment).toHaveBeenCalledWith('org-123', 'apt-1', dto);
  });

  it('should delete appointment', async () => {
    const result = await controller.deleteAppointment(req, 'apt-1');
    expect(result).toEqual({ success: true });
    expect(service.deleteAppointment).toHaveBeenCalledWith('org-123', 'apt-1');
  });

  it('should get appointments by period', async () => {
    const query = { startDate: '2026-06-01', endDate: '2026-06-30' } as any;
    const result = await controller.getAppointmentsByPeriod(req, query);
    expect(result).toEqual({ items: [] });
    expect(service.getAppointmentsByPeriod).toHaveBeenCalledWith('org-123', query);
  });

  it('should confirm appointment', async () => {
    const result = await controller.confirmAppointment(req, 'apt-1');
    expect(result).toEqual({ id: 'apt-1', status: 'CONFIRMED' });
    expect(service.confirmAppointment).toHaveBeenCalledWith('org-123', 'apt-1');
  });

  it('should cancel appointment', async () => {
    const result = await controller.cancelAppointment(req, 'apt-1');
    expect(result).toEqual({ id: 'apt-1', status: 'CANCELLED' });
    expect(service.cancelAppointment).toHaveBeenCalledWith('org-123', 'apt-1');
  });

  it('should get count by status', async () => {
    const result = await controller.getCountByStatus(req);
    expect(result).toEqual({ SCHEDULED: 5, CONFIRMED: 3 });
    expect(service.getCountByStatus).toHaveBeenCalledWith('org-123');
  });

  it('should get pending reminders', async () => {
    const result = await controller.getPendingReminders(req, 24);
    expect(result).toEqual({ items: [] });
    expect(service.getPendingReminders).toHaveBeenCalledWith('org-123', 24);
  });

  it('should get pending reminders with default hours', async () => {
    const result = await controller.getPendingReminders(req);
    expect(result).toEqual({ items: [] });
    expect(service.getPendingReminders).toHaveBeenCalledWith('org-123', 24);
  });

  it('should mark reminder sent', async () => {
    const result = await controller.markReminderSent(req, 'apt-1');
    expect(result).toEqual({ id: 'apt-1', reminderSent: true });
    expect(service.markReminderSent).toHaveBeenCalledWith('org-123', 'apt-1');
  });
});
