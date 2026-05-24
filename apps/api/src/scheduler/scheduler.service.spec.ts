import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchedulerService } from './scheduler.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let prisma: any;
  let eventBus: any;

  const orgId = 'org-1';
  const userId = 'user-1';

  const mockAppointment = {
    id: 'apt-1',
    organizationId: orgId,
    customerId: 'cust-1',
    title: 'Consulta',
    description: 'Desc',
    status: 'SCHEDULED',
    startsAt: new Date('2026-06-10T10:00:00Z'),
    endsAt: new Date('2026-06-10T11:00:00Z'),
    location: 'Sala 1',
    metadata: {},
    reminderSent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: { id: 'cust-1', name: 'João', email: 'joao@test.com', phone: '999999999' },
  };

  beforeEach(() => {
    prisma = {
      appointment: {
        create: vi.fn().mockResolvedValue(mockAppointment),
        findMany: vi.fn().mockResolvedValue([mockAppointment]),
        findFirst: vi.fn().mockResolvedValue(mockAppointment),
        update: vi.fn().mockResolvedValue(mockAppointment),
        delete: vi.fn().mockResolvedValue(mockAppointment),
        count: vi.fn().mockResolvedValue(1),
        groupBy: vi.fn().mockResolvedValue([]),
      },
    } as any;
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) } as any;
    service = new SchedulerService(prisma, eventBus);
  });

  describe('createAppointment', () => {
    const dto = {
      customerId: 'cust-1',
      title: 'Consulta',
      description: 'Desc',
      startsAt: '2026-06-10T10:00:00Z',
      endsAt: '2026-06-10T11:00:00Z',
      location: 'Sala 1',
      metadata: { serviceType: 'consulta' },
    };

    it('should create an appointment with default status SCHEDULED', async () => {
      const result = await service.createAppointment(orgId, dto, userId);

      expect(prisma.appointment.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          customerId: 'cust-1',
          title: 'Consulta',
          description: 'Desc',
          status: 'SCHEDULED',
          startsAt: new Date('2026-06-10T10:00:00Z'),
          endsAt: new Date('2026-06-10T11:00:00Z'),
          location: 'Sala 1',
          metadata: { serviceType: 'consulta' },
          reminderSent: false,
        },
        include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
      });
      expect(result.id).toBe('apt-1');
    });

    it('should use provided status when given', async () => {
      await service.createAppointment(orgId, { ...dto, status: 'CONFIRMED' }, userId);
      expect(prisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CONFIRMED' }),
        }),
      );
    });

    it('should default metadata to empty object when not provided', async () => {
      const { metadata, ...dtoWithoutMeta } = dto;
      await service.createAppointment(orgId, dtoWithoutMeta, userId);
      expect(prisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ metadata: {} }),
        }),
      );
    });

    it('should throw ConflictException when endsAt <= startsAt', async () => {
      await expect(
        service.createAppointment(orgId, { ...dto, startsAt: '2026-06-10T11:00:00Z', endsAt: '2026-06-10T10:00:00Z' }, userId),
      ).rejects.toThrow(ConflictException);
      expect(prisma.appointment.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when endsAt equals startsAt', async () => {
      await expect(
        service.createAppointment(orgId, { ...dto, endsAt: dto.startsAt }, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('should emit APPOINTMENT_CREATED event with proper payload', async () => {
      await service.createAppointment(orgId, dto, userId);
      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'APPOINTMENT_CREATED',
        source: 'scheduler-service',
        payload: {
          appointmentId: 'apt-1',
          title: 'Consulta',
          startsAt: mockAppointment.startsAt.toISOString(),
          endsAt: mockAppointment.endsAt.toISOString(),
          customerId: 'cust-1',
        },
      });
    });
  });

  describe('getAppointments', () => {
    it('should return paginated results with defaults', async () => {
      prisma.appointment.findMany.mockResolvedValue([mockAppointment]);
      prisma.appointment.count.mockResolvedValue(1);

      const result = await service.getAppointments(orgId, {});

      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
        orderBy: { startsAt: 'asc' },
        skip: 0,
        take: 25,
      });
      expect(prisma.appointment.count).toHaveBeenCalledWith({ where: { organizationId: orgId } });
      expect(result).toEqual({
        data: [mockAppointment],
        total: 1,
        page: 1,
        perPage: 25,
        totalPages: 1,
      });
    });

    it('should apply status filter when provided', async () => {
      await service.getAppointments(orgId, { status: 'CONFIRMED' });

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'CONFIRMED' }),
        }),
      );
    });

    it('should apply customerId filter when provided', async () => {
      await service.getAppointments(orgId, { customerId: 'cust-1' });

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust-1' }),
        }),
      );
    });

    it('should apply pagination params correctly', async () => {
      await service.getAppointments(orgId, { page: 3, perPage: 10 });

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should calculate totalPages correctly rounding up', async () => {
      prisma.appointment.count.mockResolvedValue(26);

      const result = await service.getAppointments(orgId, { perPage: 25 });
      expect(result.totalPages).toBe(2);
    });

    it('should return empty array when no appointments exist', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.appointment.count.mockResolvedValue(0);

      const result = await service.getAppointments(orgId, {});
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getAppointment', () => {
    it('should return appointment when found', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);

      const result = await service.getAppointment(orgId, 'apt-1');
      expect(result.id).toBe('apt-1');
      expect(prisma.appointment.findFirst).toHaveBeenCalledWith({
        where: { id: 'apt-1', organizationId: orgId },
        include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);
      await expect(service.getAppointment(orgId, 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAppointment', () => {
    it('should throw NotFoundException when appointment does not exist', async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);
      await expect(service.updateAppointment(orgId, 'invalid', { title: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updated date range is invalid', async () => {
      await expect(
        service.updateAppointment(orgId, 'apt-1', {
          startsAt: '2026-06-10T11:00:00Z',
          endsAt: '2026-06-10T10:00:00Z',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when existing + updated date range is invalid', async () => {
      prisma.appointment.findFirst.mockResolvedValue({
        ...mockAppointment,
        startsAt: new Date('2026-06-10T10:00:00Z'),
        endsAt: new Date('2026-06-10T11:00:00Z'),
      });
      await expect(
        service.updateAppointment(orgId, 'apt-1', { startsAt: '2026-06-10T12:00:00Z' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should update only provided fields', async () => {
      await service.updateAppointment(orgId, 'apt-1', { title: 'Updated Title' });

      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: { title: 'Updated Title' },
        include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
      });
    });

    it('should update all fields', async () => {
      await service.updateAppointment(orgId, 'apt-1', {
        customerId: 'cust-2',
        title: 'New Title',
        description: 'New Desc',
        status: 'CONFIRMED',
        startsAt: '2026-06-11T10:00:00Z',
        endsAt: '2026-06-11T11:00:00Z',
        location: 'Sala 2',
        metadata: { key: 'val' },
      });

      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: {
          customerId: 'cust-2',
          title: 'New Title',
          description: 'New Desc',
          status: 'CONFIRMED',
          startsAt: new Date('2026-06-11T10:00:00Z'),
          endsAt: new Date('2026-06-11T11:00:00Z'),
          location: 'Sala 2',
          metadata: { key: 'val' },
        },
        include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
      });
    });

    it('should set customerId to null when empty string is provided', async () => {
      await service.updateAppointment(orgId, 'apt-1', { customerId: '' });
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ customerId: null }),
        }),
      );
    });

    it('should return the updated appointment', async () => {
      const updated = { ...mockAppointment, title: 'Updated' };
      prisma.appointment.update.mockResolvedValue(updated);

      const result = await service.updateAppointment(orgId, 'apt-1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });
  });

  describe('deleteAppointment', () => {
    it('should throw NotFoundException when appointment does not exist', async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);
      await expect(service.deleteAppointment(orgId, 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('should delete and return success message', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      const result = await service.deleteAppointment(orgId, 'apt-1');
      expect(prisma.appointment.delete).toHaveBeenCalledWith({ where: { id: 'apt-1' } });
      expect(result).toEqual({ message: 'Agendamento removido' });
    });
  });

  describe('getAppointmentsByPeriod', () => {
    it('should return appointments within date range', async () => {
      const result = await service.getAppointmentsByPeriod(orgId, {
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      });

      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          startsAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
        orderBy: { startsAt: 'asc' },
      });
      expect(result).toEqual({
        data: [mockAppointment],
        total: 1,
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      });
    });

    it('should filter by status when provided', async () => {
      await service.getAppointmentsByPeriod(orgId, {
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        status: 'CONFIRMED',
      });

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'CONFIRMED' }),
        }),
      );
    });

    it('should filter by customerId when provided', async () => {
      await service.getAppointmentsByPeriod(orgId, {
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        customerId: 'cust-1',
      });

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust-1' }),
        }),
      );
    });

    it('should return empty data array when no matches', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);
      const result = await service.getAppointmentsByPeriod(orgId, {
        startDate: '2026-01-01',
        endDate: '2026-01-02',
      });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('confirmAppointment', () => {
    it('should throw NotFoundException when appointment does not exist', async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);
      await expect(service.confirmAppointment(orgId, 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when status is not SCHEDULED', async () => {
      prisma.appointment.findFirst.mockResolvedValue({ ...mockAppointment, status: 'CONFIRMED' });
      await expect(service.confirmAppointment(orgId, 'apt-1')).rejects.toThrow(ConflictException);
    });

    it('should update status to CONFIRMED and emit event', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      const updated = { ...mockAppointment, status: 'CONFIRMED' };
      prisma.appointment.update.mockResolvedValue(updated);

      const result = await service.confirmAppointment(orgId, 'apt-1');

      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: { status: AppointmentStatus.CONFIRMED },
        include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
      });
      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'APPOINTMENT_CONFIRMED',
        source: 'scheduler-service',
        payload: {
          appointmentId: 'apt-1',
          title: 'Consulta',
          startsAt: updated.startsAt.toISOString(),
          customerId: 'cust-1',
        },
      });
      expect(result.status).toBe('CONFIRMED');
    });
  });

  describe('cancelAppointment', () => {
    it('should throw NotFoundException when appointment does not exist', async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);
      await expect(service.cancelAppointment(orgId, 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when status is COMPLETED', async () => {
      prisma.appointment.findFirst.mockResolvedValue({ ...mockAppointment, status: 'COMPLETED' });
      await expect(service.cancelAppointment(orgId, 'apt-1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when status is CANCELLED', async () => {
      prisma.appointment.findFirst.mockResolvedValue({ ...mockAppointment, status: 'CANCELLED' });
      await expect(service.cancelAppointment(orgId, 'apt-1')).rejects.toThrow(ConflictException);
    });

    it('should update status to CANCELLED and emit event', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      const updated = { ...mockAppointment, status: 'CANCELLED' };
      prisma.appointment.update.mockResolvedValue(updated);

      const result = await service.cancelAppointment(orgId, 'apt-1');

      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: { status: AppointmentStatus.CANCELLED },
        include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
      });
      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'APPOINTMENT_CANCELLED',
        source: 'scheduler-service',
        payload: {
          appointmentId: 'apt-1',
          title: 'Consulta',
          startsAt: updated.startsAt.toISOString(),
          customerId: 'cust-1',
        },
      });
      expect(result.status).toBe('CANCELLED');
    });

    it('should allow cancelling IN_PROGRESS appointment', async () => {
      prisma.appointment.findFirst.mockResolvedValue({ ...mockAppointment, status: 'IN_PROGRESS' });
      await expect(service.cancelAppointment(orgId, 'apt-1')).resolves.not.toThrow();
    });

    it('should allow cancelling NO_SHOW appointment', async () => {
      prisma.appointment.findFirst.mockResolvedValue({ ...mockAppointment, status: 'NO_SHOW' });
      await expect(service.cancelAppointment(orgId, 'apt-1')).resolves.not.toThrow();
    });
  });

  describe('getCountByStatus', () => {
    it('should group appointments by status', async () => {
      prisma.appointment.groupBy.mockResolvedValue([
        { status: 'SCHEDULED', _count: { status: 5 } },
        { status: 'CONFIRMED', _count: { status: 3 } },
      ]);

      const result = await service.getCountByStatus(orgId);

      expect(prisma.appointment.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { status: true },
      });
      expect(result.counts.SCHEDULED).toBe(5);
      expect(result.counts.CONFIRMED).toBe(3);
      expect(result.total).toBe(8);
    });

    it('should ensure all statuses are present even if zero', async () => {
      prisma.appointment.groupBy.mockResolvedValue([]);

      const result = await service.getCountByStatus(orgId);

      const allStatuses = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
      for (const s of allStatuses) {
        expect(result.counts[s]).toBe(0);
      }
      expect(result.total).toBe(0);
    });

    it('should calculate total correctly', async () => {
      prisma.appointment.groupBy.mockResolvedValue([
        { status: 'SCHEDULED', _count: { status: 10 } },
        { status: 'CANCELLED', _count: { status: 2 } },
      ]);

      const result = await service.getCountByStatus(orgId);
      expect(result.total).toBe(12);
    });
  });

  describe('getPendingReminders', () => {
    it('should return appointments needing reminders within default threshold', async () => {
      const result = await service.getPendingReminders(orgId);

      const now = new Date();
      const threshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          reminderSent: false,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          startsAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
        orderBy: { startsAt: 'asc' },
      });

      expect(result.data).toEqual([mockAppointment]);
      expect(result.total).toBe(1);
      expect(result.hoursBefore).toBe(24);
    });

    it('should use custom hoursBefore threshold', async () => {
      const result = await service.getPendingReminders(orgId, 48);
      expect(result.hoursBefore).toBe(48);
    });

    it('should return empty if no pending reminders', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);
      const result = await service.getPendingReminders(orgId);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('markReminderSent', () => {
    it('should throw NotFoundException when appointment does not exist', async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);
      await expect(service.markReminderSent(orgId, 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('should update reminderSent to true', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);
      const updated = { ...mockAppointment, reminderSent: true };
      prisma.appointment.update.mockResolvedValue(updated);

      const result = await service.markReminderSent(orgId, 'apt-1');

      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        data: { reminderSent: true },
        include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
      });
      expect(result.reminderSent).toBe(true);
    });
  });
});
