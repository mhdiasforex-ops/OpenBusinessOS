import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RhService } from './rh.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EmployeeStatus, LeaveStatus, LeaveType } from '@prisma/client';
import {
  CreateEmployeeDto, UpdateEmployeeDto,
  CreateTimeEntryDto, CreatePayrollDto, CreateLeaveRequestDto,
} from './rh.dto';

describe('RhService', () => {
  let service: RhService;
  let prisma: any;

  const orgId = 'org-123';

  beforeEach(() => {
    prisma = {
      employee: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      timeEntry: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      payroll: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      leaveRequest: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
    };
    service = new RhService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createEmployee', () => {
    const dto: CreateEmployeeDto = {
      name: 'João Silva',
      email: 'joao@empresa.com',
      document: '123.456.789-00',
      position: 'Desenvolvedor',
      department: 'Tecnologia',
      hireDate: '2024-01-15',
      salary: 5000,
      status: 'ACTIVE',
      metadata: { chave: 'valor' },
    };

    it('should create employee with all provided fields', async () => {
      const created = { id: 'emp-1', organizationId: orgId, ...dto, hireDate: new Date(dto.hireDate!), status: EmployeeStatus.ACTIVE, metadata: dto.metadata };
      prisma.employee.create.mockResolvedValue(created);

      const result = await service.createEmployee(orgId, dto);

      expect(prisma.employee.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          name: dto.name,
          email: dto.email,
          document: dto.document,
          position: dto.position,
          department: dto.department,
          hireDate: new Date(dto.hireDate!),
          salary: dto.salary,
          status: EmployeeStatus.ACTIVE,
          metadata: dto.metadata,
        },
      });
      expect(result).toEqual(created);
    });

    it('should default status to ACTIVE when not provided', async () => {
      const dtoNoStatus: CreateEmployeeDto = { name: 'Maria' };
      const created = { id: 'emp-1', organizationId: orgId, name: 'Maria', status: EmployeeStatus.ACTIVE, metadata: {} };
      prisma.employee.create.mockResolvedValue(created);

      await service.createEmployee(orgId, dtoNoStatus);

      expect(prisma.employee.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: EmployeeStatus.ACTIVE,
          metadata: {},
        }),
      });
    });

    it('should set hireDate to undefined when not provided', async () => {
      const dtoNoHire: CreateEmployeeDto = { name: 'Pedro' };
      prisma.employee.create.mockResolvedValue({ id: 'emp-1', organizationId: orgId, name: 'Pedro', metadata: {} });

      await service.createEmployee(orgId, dtoNoHire);

      expect(prisma.employee.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ hireDate: undefined }),
      });
    });

    it('should convert status string to EmployeeStatus enum', async () => {
      const dtoWithStatus: CreateEmployeeDto = { name: 'Ana', status: 'ON_LEAVE' };
      prisma.employee.create.mockResolvedValue({ id: 'emp-1', organizationId: orgId, name: 'Ana', status: EmployeeStatus.ON_LEAVE, metadata: {} });

      await service.createEmployee(orgId, dtoWithStatus);

      expect(prisma.employee.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: EmployeeStatus.ON_LEAVE }),
      });
    });

    it('should default metadata to empty object when not provided', async () => {
      prisma.employee.create.mockResolvedValue({ id: 'emp-1', organizationId: orgId, name: 'Test', metadata: {} });

      await service.createEmployee(orgId, { name: 'Test' });

      expect(prisma.employee.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ metadata: {} }),
      });
    });
  });

  describe('getEmployees', () => {
    it('should return paginated employees with default page and perPage', async () => {
      const employees = [{ id: 'emp-1', name: 'João' }];
      prisma.employee.findMany.mockResolvedValue(employees);
      prisma.employee.count.mockResolvedValue(1);

      const result = await service.getEmployees(orgId, {});

      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 25,
      });
      expect(prisma.employee.count).toHaveBeenCalledWith({
        where: { organizationId: orgId },
      });
      expect(result).toEqual({ data: employees, total: 1, page: 1, perPage: 25, totalPages: 1 });
    });

    it('should filter by status', async () => {
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(0);

      await service.getEmployees(orgId, { status: 'ACTIVE' });

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId, status: EmployeeStatus.ACTIVE },
        }),
      );
    });

    it('should filter by department (case-insensitive contains)', async () => {
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(0);

      await service.getEmployees(orgId, { department: 'tecnologia' });

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId, department: { contains: 'tecnologia', mode: 'insensitive' } },
        }),
      );
    });

    it('should filter by search across name, email, and document', async () => {
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(0);

      await service.getEmployees(orgId, { search: 'joão' });

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: orgId,
            OR: [
              { name: { contains: 'joão', mode: 'insensitive' } },
              { email: { contains: 'joão', mode: 'insensitive' } },
              { document: { contains: 'joão' } },
            ],
          },
        }),
      );
    });

    it('should apply pagination with custom page and perPage', async () => {
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(0);

      await service.getEmployees(orgId, { page: 3, perPage: 10 });

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(55);

      const result = await service.getEmployees(orgId, { perPage: 10 });

      expect(result.totalPages).toBe(6);
    });

    it('should combine status, department, and search filters', async () => {
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(0);

      await service.getEmployees(orgId, { status: 'ACTIVE', department: 'TI', search: 'maria' });

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: orgId,
            status: EmployeeStatus.ACTIVE,
            department: { contains: 'TI', mode: 'insensitive' },
            OR: [
              { name: { contains: 'maria', mode: 'insensitive' } },
              { email: { contains: 'maria', mode: 'insensitive' } },
              { document: { contains: 'maria' } },
            ],
          },
        }),
      );
    });
  });

  describe('getEmployee', () => {
    const employeeWithRelations = {
      id: 'emp-1',
      organizationId: orgId,
      name: 'João Silva',
      timeEntries: [],
      payrolls: [],
      leaveRequests: [],
    };

    it('should return employee with related data when found', async () => {
      prisma.employee.findFirst.mockResolvedValue(employeeWithRelations);

      const result = await service.getEmployee(orgId, 'emp-1');

      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: { id: 'emp-1', organizationId: orgId },
        include: {
          timeEntries: { orderBy: { date: 'desc' }, take: 30 },
          payrolls: { orderBy: { year: 'desc' }, take: 12 },
          leaveRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      });
      expect(result).toEqual(employeeWithRelations);
    });

    it('should throw NotFoundException when employee does not exist', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(service.getEmployee(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when employee belongs to another org', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(service.getEmployee(orgId, 'emp-other-org')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateEmployee', () => {
    const existingEmployee = { id: 'emp-1', organizationId: orgId, name: 'João', email: 'joao@old.com' };

    it('should verify employee exists then update', async () => {
      prisma.employee.findFirst.mockResolvedValue(existingEmployee);
      const updated = { ...existingEmployee, name: 'João Santos', email: 'joao@new.com' };
      prisma.employee.update.mockResolvedValue(updated);

      const result = await service.updateEmployee(orgId, 'emp-1', { name: 'João Santos', email: 'joao@new.com' });

      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: { id: 'emp-1', organizationId: orgId },
      });
      expect(prisma.employee.update).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        data: {
          name: 'João Santos',
          email: 'joao@new.com',
          document: undefined,
          position: undefined,
          department: undefined,
          hireDate: undefined,
          salary: undefined,
          status: undefined,
          metadata: undefined,
        },
      });
      expect(result).toEqual(updated);
    });

    it('should convert hireDate string to Date when provided', async () => {
      prisma.employee.findFirst.mockResolvedValue(existingEmployee);
      prisma.employee.update.mockImplementation((_: any) => Promise.resolve(_.data));

      await service.updateEmployee(orgId, 'emp-1', { hireDate: '2025-06-01' });

      expect(prisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ hireDate: new Date('2025-06-01') }),
        }),
      );
    });

    it('should convert status string to EmployeeStatus when provided', async () => {
      prisma.employee.findFirst.mockResolvedValue(existingEmployee);
      prisma.employee.update.mockImplementation((_: any) => Promise.resolve(_.data));

      await service.updateEmployee(orgId, 'emp-1', { status: 'ON_LEAVE' });

      expect(prisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: EmployeeStatus.ON_LEAVE }),
        }),
      );
    });

    it('should throw NotFoundException when employee does not exist', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(
        service.updateEmployee(orgId, 'nonexistent', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.employee.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteEmployee', () => {
    const employee = { id: 'emp-1', organizationId: orgId, name: 'João' };

    it('should verify employee exists then delete and return message', async () => {
      prisma.employee.findFirst.mockResolvedValue(employee);
      prisma.employee.delete.mockResolvedValue(employee);

      const result = await service.deleteEmployee(orgId, 'emp-1');

      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: { id: 'emp-1', organizationId: orgId },
      });
      expect(prisma.employee.delete).toHaveBeenCalledWith({ where: { id: 'emp-1' } });
      expect(result).toEqual({ message: 'Colaborador removido' });
    });

    it('should throw NotFoundException when employee does not exist', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(service.deleteEmployee(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(prisma.employee.delete).not.toHaveBeenCalled();
    });
  });

  describe('createTimeEntry', () => {
    const employeeId = 'emp-1';
    const dto: CreateTimeEntryDto = {
      date: '2024-06-15',
      clockIn: '2024-06-15T08:00:00Z',
      clockOut: '2024-06-15T17:00:00Z',
      breakMinutes: 60,
      notes: 'Hora extra não autorizada',
    };

    it('should verify employee exists then create time entry', async () => {
      prisma.employee.findFirst.mockResolvedValue({ id: employeeId, organizationId: orgId });
      const created = { id: 'te-1', organizationId: orgId, employeeId, date: new Date(dto.date), clockIn: new Date(dto.clockIn), clockOut: new Date(dto.clockOut!), breakMinutes: 60, notes: dto.notes };
      prisma.timeEntry.create.mockResolvedValue(created);

      const result = await service.createTimeEntry(orgId, employeeId, dto);

      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: { id: employeeId, organizationId: orgId },
      });
      expect(prisma.timeEntry.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          employeeId,
          date: new Date(dto.date),
          clockIn: new Date(dto.clockIn),
          clockOut: new Date(dto.clockOut!),
          breakMinutes: 60,
          notes: dto.notes,
        },
      });
      expect(result).toEqual(created);
    });

    it('should set clockOut to undefined when not provided', async () => {
      prisma.employee.findFirst.mockResolvedValue({ id: employeeId, organizationId: orgId });
      prisma.timeEntry.create.mockImplementation((_: any) => Promise.resolve(_.data));

      await service.createTimeEntry(orgId, employeeId, { date: '2024-06-15', clockIn: '2024-06-15T08:00:00Z' });

      expect(prisma.timeEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ clockOut: undefined }),
        }),
      );
    });

    it('should default breakMinutes to 0 when not provided', async () => {
      prisma.employee.findFirst.mockResolvedValue({ id: employeeId, organizationId: orgId });
      prisma.timeEntry.create.mockImplementation((_: any) => Promise.resolve(_.data));

      await service.createTimeEntry(orgId, employeeId, { date: '2024-06-15', clockIn: '2024-06-15T08:00:00Z' });

      expect(prisma.timeEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ breakMinutes: 0 }),
        }),
      );
    });

    it('should throw NotFoundException when employee does not exist', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(
        service.createTimeEntry(orgId, 'nonexistent', dto),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.timeEntry.create).not.toHaveBeenCalled();
    });
  });

  describe('getTimeEntries', () => {
    const employeeId = 'emp-1';

    it('should return all time entries when no month/year filters', async () => {
      const entries = [{ id: 'te-1', employeeId }];
      prisma.timeEntry.findMany.mockResolvedValue(entries);

      const result = await service.getTimeEntries(orgId, employeeId, {});

      expect(prisma.timeEntry.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId, employeeId },
        orderBy: { date: 'desc' },
      });
      expect(result).toEqual(entries);
    });

    it('should filter by month and year', async () => {
      const fixedNow = new Date(2026, 5, 15); // June 15, 2026
      vi.useFakeTimers().setSystemTime(fixedNow);

      const entries = [{ id: 'te-1', employeeId }];
      prisma.timeEntry.findMany.mockResolvedValue(entries);

      const result = await service.getTimeEntries(orgId, employeeId, { month: 6, year: 2026 });

      expect(prisma.timeEntry.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          employeeId,
          date: {
            gte: new Date(2026, 5, 1),
            lt: new Date(2026, 6, 1),
          },
        },
        orderBy: { date: 'desc' },
      });
      expect(result).toEqual(entries);

      vi.useRealTimers();
    });

    it('should default month and year to current when only one provided', async () => {
      const fixedNow = new Date(2026, 5, 15);
      vi.useFakeTimers().setSystemTime(fixedNow);

      prisma.timeEntry.findMany.mockResolvedValue([]);

      await service.getTimeEntries(orgId, employeeId, { month: 3 });

      expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: {
              gte: new Date(2026, 2, 1),
              lt: new Date(2026, 3, 1),
            },
          }),
        }),
      );

      vi.useRealTimers();
    });

    it('should default month and year to current when only year provided', async () => {
      const fixedNow = new Date(2026, 5, 15);
      vi.useFakeTimers().setSystemTime(fixedNow);

      prisma.timeEntry.findMany.mockResolvedValue([]);

      await service.getTimeEntries(orgId, employeeId, { year: 2025 });

      expect(prisma.timeEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: {
              gte: new Date(2025, 5, 1),
              lt: new Date(2025, 6, 1),
            },
          }),
        }),
      );

      vi.useRealTimers();
    });
  });

  describe('createPayroll', () => {
    const employeeId = 'emp-1';
    const dto: CreatePayrollDto = {
      month: 6,
      year: 2024,
      baseSalary: 5000,
      additions: 500,
      deductions: 200,
      netPay: 5300,
      metadata: { bonus: 'performance' },
    };

    it('should verify employee and uniqueness, then create payroll', async () => {
      prisma.employee.findFirst.mockResolvedValue({ id: employeeId, organizationId: orgId });
      prisma.payroll.findUnique.mockResolvedValue(null);
      const created = { id: 'pr-1', organizationId: orgId, employeeId, ...dto };
      prisma.payroll.create.mockResolvedValue(created);

      const result = await service.createPayroll(orgId, employeeId, dto);

      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: { id: employeeId, organizationId: orgId },
      });
      expect(prisma.payroll.findUnique).toHaveBeenCalledWith({
        where: { employeeId_month_year: { employeeId, month: dto.month, year: dto.year } },
      });
      expect(prisma.payroll.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          employeeId,
          month: dto.month,
          year: dto.year,
          baseSalary: dto.baseSalary,
          additions: dto.additions,
          deductions: dto.deductions,
          netPay: dto.netPay,
          metadata: dto.metadata,
        },
      });
      expect(result).toEqual(created);
    });

    it('should default additions, deductions to 0, netPay to baseSalary, metadata to {}', async () => {
      prisma.employee.findFirst.mockResolvedValue({ id: employeeId, organizationId: orgId });
      prisma.payroll.findUnique.mockResolvedValue(null);
      prisma.payroll.create.mockImplementation((_: any) => Promise.resolve(_.data));

      const result = await service.createPayroll(orgId, employeeId, { month: 1, year: 2025, baseSalary: 3000 });

      expect(result.additions).toBe(0);
      expect(result.deductions).toBe(0);
      expect(result.netPay).toBe(3000);
      expect(result.metadata).toEqual({});
    });

    it('should throw NotFoundException when employee does not exist', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(
        service.createPayroll(orgId, 'nonexistent', dto),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.payroll.findUnique).not.toHaveBeenCalled();
      expect(prisma.payroll.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when payroll already exists for month/year', async () => {
      prisma.employee.findFirst.mockResolvedValue({ id: employeeId, organizationId: orgId });
      prisma.payroll.findUnique.mockResolvedValue({ id: 'existing-pr', employeeId, month: 6, year: 2024 });

      await expect(
        service.createPayroll(orgId, employeeId, dto),
      ).rejects.toThrow(ConflictException);

      expect(prisma.payroll.create).not.toHaveBeenCalled();
    });
  });

  describe('getPayrolls', () => {
    it('should return payrolls ordered by year and month descending', async () => {
      const payrolls = [
        { id: 'pr-1', employeeId: 'emp-1', year: 2024, month: 6 },
        { id: 'pr-2', employeeId: 'emp-1', year: 2024, month: 5 },
      ];
      prisma.payroll.findMany.mockResolvedValue(payrolls);

      const result = await service.getPayrolls(orgId, 'emp-1');

      expect(prisma.payroll.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId, employeeId: 'emp-1' },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });
      expect(result).toEqual(payrolls);
    });

    it('should return empty array when no payrolls exist', async () => {
      prisma.payroll.findMany.mockResolvedValue([]);

      const result = await service.getPayrolls(orgId, 'emp-1');

      expect(result).toEqual([]);
    });
  });

  describe('createLeaveRequest', () => {
    const employeeId = 'emp-1';
    const dto: CreateLeaveRequestDto = {
      type: 'VACATION',
      startDate: '2024-07-01',
      endDate: '2024-07-15',
      days: 15,
      reason: 'Férias anuais',
    };

    it('should verify employee exists then create leave request', async () => {
      prisma.employee.findFirst.mockResolvedValue({ id: employeeId, organizationId: orgId });
      const created = { id: 'lr-1', organizationId: orgId, employeeId, type: LeaveType.VACATION, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate), days: 15, reason: dto.reason };
      prisma.leaveRequest.create.mockResolvedValue(created);

      const result = await service.createLeaveRequest(orgId, employeeId, dto);

      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: { id: employeeId, organizationId: orgId },
      });
      expect(prisma.leaveRequest.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          employeeId,
          type: LeaveType.VACATION,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          days: dto.days,
          reason: dto.reason,
        },
      });
      expect(result).toEqual(created);
    });

    it('should throw NotFoundException when employee does not exist', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(
        service.createLeaveRequest(orgId, 'nonexistent', dto),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.leaveRequest.create).not.toHaveBeenCalled();
    });
  });

  describe('getLeaveRequests', () => {
    it('should return leave requests ordered by createdAt desc with employee include', async () => {
      const requests = [
        { id: 'lr-1', employeeId: 'emp-1', employee: { id: 'emp-1', name: 'João' } },
      ];
      prisma.leaveRequest.findMany.mockResolvedValue(requests);

      const result = await service.getLeaveRequests(orgId, 'emp-1');

      expect(prisma.leaveRequest.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId, employeeId: 'emp-1' },
        orderBy: { createdAt: 'desc' },
        include: { employee: { select: { id: true, name: true } } },
      });
      expect(result).toEqual(requests);
    });

    it('should return empty array when no leave requests exist', async () => {
      prisma.leaveRequest.findMany.mockResolvedValue([]);

      const result = await service.getLeaveRequests(orgId, 'emp-1');

      expect(result).toEqual([]);
    });
  });

  describe('approveLeaveRequest', () => {
    const leaveRequest = { id: 'lr-1', organizationId: orgId, status: LeaveStatus.PENDING };

    it('should approve a pending leave request', async () => {
      prisma.leaveRequest.findFirst.mockResolvedValue(leaveRequest);
      const updated = { ...leaveRequest, status: LeaveStatus.APPROVED, approvedById: 'manager-1', approvedAt: new Date() };
      prisma.leaveRequest.update.mockResolvedValue(updated);

      const result = await service.approveLeaveRequest(orgId, 'lr-1', 'manager-1');

      expect(prisma.leaveRequest.findFirst).toHaveBeenCalledWith({
        where: { id: 'lr-1', organizationId: orgId },
      });
      expect(prisma.leaveRequest.update).toHaveBeenCalledWith({
        where: { id: 'lr-1' },
        data: { status: LeaveStatus.APPROVED, approvedById: 'manager-1', approvedAt: expect.any(Date) },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when leave request does not exist', async () => {
      prisma.leaveRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.approveLeaveRequest(orgId, 'nonexistent', 'manager-1'),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when leave request is already processed', async () => {
      prisma.leaveRequest.findFirst.mockResolvedValue({ ...leaveRequest, status: LeaveStatus.APPROVED });

      await expect(
        service.approveLeaveRequest(orgId, 'lr-1', 'manager-1'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when leave request is already rejected', async () => {
      prisma.leaveRequest.findFirst.mockResolvedValue({ ...leaveRequest, status: LeaveStatus.REJECTED });

      await expect(
        service.approveLeaveRequest(orgId, 'lr-1', 'manager-1'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
    });
  });

  describe('rejectLeaveRequest', () => {
    const leaveRequest = { id: 'lr-1', organizationId: orgId, status: LeaveStatus.PENDING };

    it('should reject a pending leave request', async () => {
      prisma.leaveRequest.findFirst.mockResolvedValue(leaveRequest);
      const updated = { ...leaveRequest, status: LeaveStatus.REJECTED, approvedById: 'manager-1', approvedAt: new Date() };
      prisma.leaveRequest.update.mockResolvedValue(updated);

      const result = await service.rejectLeaveRequest(orgId, 'lr-1', 'manager-1');

      expect(prisma.leaveRequest.findFirst).toHaveBeenCalledWith({
        where: { id: 'lr-1', organizationId: orgId },
      });
      expect(prisma.leaveRequest.update).toHaveBeenCalledWith({
        where: { id: 'lr-1' },
        data: { status: LeaveStatus.REJECTED, approvedById: 'manager-1', approvedAt: expect.any(Date) },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when leave request does not exist', async () => {
      prisma.leaveRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.rejectLeaveRequest(orgId, 'nonexistent', 'manager-1'),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when leave request is already approved', async () => {
      prisma.leaveRequest.findFirst.mockResolvedValue({ ...leaveRequest, status: LeaveStatus.APPROVED });

      await expect(
        service.rejectLeaveRequest(orgId, 'lr-1', 'manager-1'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when leave request is already rejected', async () => {
      prisma.leaveRequest.findFirst.mockResolvedValue({ ...leaveRequest, status: LeaveStatus.REJECTED });

      await expect(
        service.rejectLeaveRequest(orgId, 'lr-1', 'manager-1'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard counts for the organization', async () => {
      prisma.employee.count
        .mockResolvedValueOnce(50)  // total
        .mockResolvedValueOnce(40)  // active
        .mockResolvedValueOnce(5)   // onLeave
        .mockResolvedValueOnce(3);  // pendingLeaves
      prisma.leaveRequest.count.mockResolvedValue(3);

      const result = await service.getDashboard(orgId);

      expect(result).toEqual({
        totalEmployees: 50,
        activeEmployees: 40,
        onLeave: 5,
        pendingLeaves: 3,
      });
    });

    it('should return zero values when no data exists', async () => {
      prisma.employee.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prisma.leaveRequest.count.mockResolvedValue(0);

      const result = await service.getDashboard(orgId);

      expect(result).toEqual({
        totalEmployees: 0,
        activeEmployees: 0,
        onLeave: 0,
        pendingLeaves: 0,
      });
    });
  });
});
