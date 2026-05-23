import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentPeriodQueryDto,
  AppointmentListQueryDto,
} from './scheduler.dto';

@ApiTags('scheduler')
@ApiBearerAuth()
@Controller('scheduler')
@UseGuards(JwtGuard, PermissionsGuard)
export class SchedulerController {
  constructor(private schedulerService: SchedulerService) {}

  // --- Appointments CRUD ---

  @Post('appointments')
  @Permissions('scheduler:manage')
  @ApiOperation({ summary: 'Criar agendamento' })
  @ApiResponse({ status: 201, description: 'Agendamento criado' })
  async createAppointment(@Request() req: any, @Body() dto: CreateAppointmentDto) {
    return this.schedulerService.createAppointment(req.user.organizationId, dto, req.user.id);
  }

  @Get('appointments')
  @Permissions('scheduler:read')
  @ApiOperation({ summary: 'Listar agendamentos com paginação' })
  async getAppointments(@Request() req: any, @Query() query: AppointmentListQueryDto) {
    return this.schedulerService.getAppointments(req.user.organizationId, query);
  }

  @Get('appointments/:id')
  @Permissions('scheduler:read')
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  async getAppointment(@Request() req: any, @Param('id') id: string) {
    return this.schedulerService.getAppointment(req.user.organizationId, id);
  }

  @Patch('appointments/:id')
  @Permissions('scheduler:manage')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  async updateAppointment(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.schedulerService.updateAppointment(req.user.organizationId, id, dto);
  }

  @Delete('appointments/:id')
  @Permissions('scheduler:manage')
  @ApiOperation({ summary: 'Remover agendamento' })
  async deleteAppointment(@Request() req: any, @Param('id') id: string) {
    return this.schedulerService.deleteAppointment(req.user.organizationId, id);
  }

  // --- Listagem por período ---

  @Get('appointments-period')
  @Permissions('scheduler:read')
  @ApiOperation({ summary: 'Listar agendamentos por período' })
  async getAppointmentsByPeriod(@Request() req: any, @Query() query: AppointmentPeriodQueryDto) {
    return this.schedulerService.getAppointmentsByPeriod(req.user.organizationId, query);
  }

  // --- Confirmação / Cancelamento ---

  @Post('appointments/:id/confirm')
  @Permissions('scheduler:manage')
  @ApiOperation({ summary: 'Confirmar agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento confirmado' })
  async confirmAppointment(@Request() req: any, @Param('id') id: string) {
    return this.schedulerService.confirmAppointment(req.user.organizationId, id);
  }

  @Post('appointments/:id/cancel')
  @Permissions('scheduler:manage')
  @ApiOperation({ summary: 'Cancelar agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento cancelado' })
  async cancelAppointment(@Request() req: any, @Param('id') id: string) {
    return this.schedulerService.cancelAppointment(req.user.organizationId, id);
  }

  // --- Contagem por status ---

  @Get('appointments-count')
  @Permissions('scheduler:read')
  @ApiOperation({ summary: 'Contagem de agendamentos por status' })
  async getCountByStatus(@Request() req: any) {
    return this.schedulerService.getCountByStatus(req.user.organizationId);
  }

  // --- Lembretes pendentes ---

  @Get('reminders-pending')
  @Permissions('scheduler:read')
  @ApiOperation({ summary: 'Listar agendamentos com lembrete pendente' })
  @ApiQuery({ name: 'hoursBefore', required: false, description: 'Horas antes do início para filtrar (padrão: 24)', type: Number })
  async getPendingReminders(@Request() req: any, @Query('hoursBefore') hoursBefore?: number) {
    return this.schedulerService.getPendingReminders(req.user.organizationId, hoursBefore ? +hoursBefore : 24);
  }

  @Post('appointments/:id/reminder-sent')
  @Permissions('scheduler:manage')
  @ApiOperation({ summary: 'Marcar lembrete como enviado para um agendamento' })
  async markReminderSent(@Request() req: any, @Param('id') id: string) {
    return this.schedulerService.markReminderSent(req.user.organizationId, id);
  }
}
