import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { AppointmentStatus } from '@prisma/client';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentPeriodQueryDto,
  AppointmentListQueryDto,
} from './scheduler.dto';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  // --- CRUD ---

  async createAppointment(orgId: string, dto: CreateAppointmentDto, userId: string) {
    // Validate date range
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) {
      throw new ConflictException('A data de término deve ser posterior à data de início');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        organizationId: orgId,
        customerId: dto.customerId,
        title: dto.title,
        description: dto.description,
        status: (dto.status || 'SCHEDULED') as AppointmentStatus,
        startsAt,
        endsAt,
        location: dto.location,
        metadata: dto.metadata || {},
        reminderSent: false,
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    // Emit event
    await this.eventBus.emit({
      organizationId: orgId,
      type: 'APPOINTMENT_CREATED',
      source: 'scheduler-service',
      payload: {
        appointmentId: appointment.id,
        title: appointment.title,
        startsAt: appointment.startsAt.toISOString(),
        endsAt: appointment.endsAt.toISOString(),
        customerId: appointment.customerId,
      },
    });

    this.logger.log(`Appointment created: ${appointment.id} for org ${orgId}`);
    return appointment;
  }

  async getAppointments(orgId: string, query: AppointmentListQueryDto) {
    const page = query.page || 1;
    const perPage = query.perPage || 25;

    const where: any = { organizationId: orgId };
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { startsAt: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  async getAppointment(orgId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, organizationId: orgId },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    return appointment;
  }

  async updateAppointment(orgId: string, id: string, dto: UpdateAppointmentDto) {
    const existing = await this.prisma.appointment.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Agendamento não encontrado');

    const data: any = {};
    if (dto.customerId !== undefined) data.customerId = dto.customerId || null;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status as AppointmentStatus;
    if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) data.endsAt = new Date(dto.endsAt);
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.metadata !== undefined) data.metadata = dto.metadata;

    // Validate date range if both dates are present or one is being updated
    const startsAt = data.startsAt || existing.startsAt;
    const endsAt = data.endsAt || existing.endsAt;
    if (endsAt <= startsAt) {
      throw new ConflictException('A data de término deve ser posterior à data de início');
    }

    return this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  }

  async deleteAppointment(orgId: string, id: string) {
    const existing = await this.prisma.appointment.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Agendamento não encontrado');

    await this.prisma.appointment.delete({ where: { id } });
    return { message: 'Agendamento removido' };
  }

  // --- Listagem por período ---

  async getAppointmentsByPeriod(orgId: string, query: AppointmentPeriodQueryDto) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    // Set endDate to end of day
    endDate.setHours(23, 59, 59, 999);

    const where: any = {
      organizationId: orgId,
      startsAt: {
        gte: startDate,
        lte: endDate,
      },
    };
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;

    const data = await this.prisma.appointment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { startsAt: 'asc' },
    });

    return { data, total: data.length, startDate: query.startDate, endDate: query.endDate };
  }

  // --- Confirmação / Cancelamento ---

  async confirmAppointment(orgId: string, id: string) {
    const existing = await this.prisma.appointment.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Agendamento não encontrado');

    if (existing.status !== 'SCHEDULED') {
      throw new ConflictException('Apenas agendamentos com status SCHEDULED podem ser confirmados');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CONFIRMED },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    await this.eventBus.emit({
      organizationId: orgId,
      type: 'APPOINTMENT_CONFIRMED',
      source: 'scheduler-service',
      payload: {
        appointmentId: id,
        title: updated.title,
        startsAt: updated.startsAt.toISOString(),
        customerId: updated.customerId,
      },
    });

    this.logger.log(`Appointment confirmed: ${id}`);
    return updated;
  }

  async cancelAppointment(orgId: string, id: string) {
    const existing = await this.prisma.appointment.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Agendamento não encontrado');

    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new ConflictException('Agendamentos concluídos ou já cancelados não podem ser cancelados');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    await this.eventBus.emit({
      organizationId: orgId,
      type: 'APPOINTMENT_CANCELLED',
      source: 'scheduler-service',
      payload: {
        appointmentId: id,
        title: updated.title,
        startsAt: updated.startsAt.toISOString(),
        customerId: updated.customerId,
      },
    });

    this.logger.log(`Appointment cancelled: ${id}`);
    return updated;
  }

  // --- Contagem por status ---

  async getCountByStatus(orgId: string) {
    const counts = await this.prisma.appointment.groupBy({
      by: ['status'],
      where: { organizationId: orgId },
      _count: { status: true },
    });

    const result: Record<string, number> = {};
    for (const item of counts) {
      result[item.status] = item._count.status;
    }

    // Ensure all statuses are present even if zero
    const allStatuses: AppointmentStatus[] = [
      'SCHEDULED',
      'CONFIRMED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
    ];
    for (const status of allStatuses) {
      if (!(status in result)) {
        result[status] = 0;
      }
    }

    const total = Object.values(result).reduce((sum, count) => sum + count, 0);

    return { counts: result, total };
  }

  // --- Lembretes pendentes ---

  async getPendingReminders(orgId: string, hoursBefore: number = 24) {
    const now = new Date();
    const reminderThreshold = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        organizationId: orgId,
        reminderSent: false,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        startsAt: {
          gte: now,
          lte: reminderThreshold,
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { startsAt: 'asc' },
    });

    return { data: appointments, total: appointments.length, hoursBefore };
  }

  async markReminderSent(orgId: string, id: string) {
    const existing = await this.prisma.appointment.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Agendamento não encontrado');

    return this.prisma.appointment.update({
      where: { id },
      data: { reminderSent: true },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  }
}
