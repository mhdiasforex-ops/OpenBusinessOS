import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeeStatus, LeaveStatus, LeaveType, PayrollStatus } from '@prisma/client';
import {
  CreateEmployeeDto, UpdateEmployeeDto,
  CreateTimeEntryDto, CreatePayrollDto, CreateLeaveRequestDto,
} from './rh.dto';

@Injectable()
export class RhService {
  private readonly logger = new Logger(RhService.name);

  constructor(private prisma: PrismaService) {}

  // --- Employees ---

  async createEmployee(orgId: string, dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        email: dto.email,
        document: dto.document,
        position: dto.position,
        department: dto.department,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
        salary: dto.salary,
        status: dto.status ? (dto.status as EmployeeStatus) : EmployeeStatus.ACTIVE,
        metadata: dto.metadata || {},
      },
    });
  }

  async getEmployees(orgId: string, filters: { status?: string; department?: string; search?: string; page?: number; perPage?: number }) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 25;

    const where: any = { organizationId: orgId };
    if (filters.status) where.status = filters.status as EmployeeStatus;
    if (filters.department) where.department = { contains: filters.department, mode: 'insensitive' };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { document: { contains: filters.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  async getEmployee(orgId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, organizationId: orgId },
      include: {
        timeEntries: { orderBy: { date: 'desc' }, take: 30 },
        payrolls: { orderBy: { year: 'desc' }, take: 12 },
        leaveRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!employee) throw new NotFoundException('Colaborador não encontrado');
    return employee;
  }

  async updateEmployee(orgId: string, id: string, dto: UpdateEmployeeDto) {
    const existing = await this.prisma.employee.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Colaborador não encontrado');

    return this.prisma.employee.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        document: dto.document,
        position: dto.position,
        department: dto.department,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
        salary: dto.salary,
        status: dto.status ? (dto.status as EmployeeStatus) : undefined,
        metadata: dto.metadata,
      },
    });
  }

  async deleteEmployee(orgId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({ where: { id, organizationId: orgId } });
    if (!employee) throw new NotFoundException('Colaborador não encontrado');

    await this.prisma.employee.delete({ where: { id } });
    return { message: 'Colaborador removido' };
  }

  // --- Time Entries (Ponto) ---

  async createTimeEntry(orgId: string, employeeId: string, dto: CreateTimeEntryDto) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
    if (!employee) throw new NotFoundException('Colaborador não encontrado');

    return this.prisma.timeEntry.create({
      data: {
        organizationId: orgId,
        employeeId,
        date: new Date(dto.date),
        clockIn: new Date(dto.clockIn),
        clockOut: dto.clockOut ? new Date(dto.clockOut) : undefined,
        breakMinutes: dto.breakMinutes || 0,
        notes: dto.notes,
      },
    });
  }

  async getTimeEntries(orgId: string, employeeId: string, filters: { month?: number; year?: number }) {
    const where: any = { organizationId: orgId, employeeId };
    if (filters.month || filters.year) {
      const year = filters.year || new Date().getFullYear();
      const month = filters.month || new Date().getMonth() + 1;
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      where.date = { gte: start, lt: end };
    }

    return this.prisma.timeEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  // --- Payroll (Folha) ---

  async createPayroll(orgId: string, employeeId: string, dto: CreatePayrollDto) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
    if (!employee) throw new NotFoundException('Colaborador não encontrado');

    // Check unique constraint
    const existing = await this.prisma.payroll.findUnique({
      where: { employeeId_month_year: { employeeId, month: dto.month, year: dto.year } },
    });
    if (existing) throw new ConflictException(`Folha de pagamento já existe para ${dto.month}/${dto.year}`);

    return this.prisma.payroll.create({
      data: {
        organizationId: orgId,
        employeeId,
        month: dto.month,
        year: dto.year,
        baseSalary: dto.baseSalary,
        additions: dto.additions || 0,
        deductions: dto.deductions || 0,
        netPay: dto.netPay || dto.baseSalary,
        metadata: dto.metadata || {},
      },
    });
  }

  async getPayrolls(orgId: string, employeeId: string) {
    return this.prisma.payroll.findMany({
      where: { organizationId: orgId, employeeId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  // --- Leave Requests (Férias/Licenças) ---

  async createLeaveRequest(orgId: string, employeeId: string, dto: CreateLeaveRequestDto) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId: orgId } });
    if (!employee) throw new NotFoundException('Colaborador não encontrado');

    return this.prisma.leaveRequest.create({
      data: {
        organizationId: orgId,
        employeeId,
        type: dto.type as LeaveType,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        days: dto.days,
        reason: dto.reason,
      },
    });
  }

  async getLeaveRequests(orgId: string, employeeId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { organizationId: orgId, employeeId },
      orderBy: { createdAt: 'desc' },
      include: { employee: { select: { id: true, name: true } } },
    });
  }

  async approveLeaveRequest(orgId: string, id: string, approvedById: string) {
    const leave = await this.prisma.leaveRequest.findFirst({ where: { id, organizationId: orgId } });
    if (!leave) throw new NotFoundException('Solicitação não encontrada');
    if (leave.status !== LeaveStatus.PENDING) throw new ConflictException('Solicitação já foi processada');

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.APPROVED,
        approvedById,
        approvedAt: new Date(),
      },
    });
  }

  async rejectLeaveRequest(orgId: string, id: string, approvedById: string) {
    const leave = await this.prisma.leaveRequest.findFirst({ where: { id, organizationId: orgId } });
    if (!leave) throw new NotFoundException('Solicitação não encontrada');
    if (leave.status !== LeaveStatus.PENDING) throw new ConflictException('Solicitação já foi processada');

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        approvedById,
        approvedAt: new Date(),
      },
    });
  }

  // --- Dashboard ---

  async getDashboard(orgId: string) {
    const [total, active, onLeave, pendingLeaves] = await Promise.all([
      this.prisma.employee.count({ where: { organizationId: orgId } }),
      this.prisma.employee.count({ where: { organizationId: orgId, status: EmployeeStatus.ACTIVE } }),
      this.prisma.employee.count({ where: { organizationId: orgId, status: EmployeeStatus.ON_LEAVE } }),
      this.prisma.leaveRequest.count({ where: { organizationId: orgId, status: LeaveStatus.PENDING } }),
    ]);

    return { totalEmployees: total, activeEmployees: active, onLeave, pendingLeaves };
  }
}
