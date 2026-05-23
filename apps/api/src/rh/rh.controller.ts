import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RhService } from './rh.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import {
  CreateEmployeeDto, UpdateEmployeeDto,
  CreateTimeEntryDto, CreatePayrollDto, CreateLeaveRequestDto,
} from './rh.dto';

@ApiTags('rh')
@ApiBearerAuth()
@Controller('rh')
@UseGuards(JwtGuard, PermissionsGuard)
export class RhController {
  constructor(private rhService: RhService) {}

  // --- Dashboard ---
  @Get('dashboard')
  @Permissions('rh:read')
  @ApiOperation({ summary: 'Dashboard RH' })
  async getDashboard(@Request() req: any) {
    return this.rhService.getDashboard(req.user.organizationId);
  }

  // --- Employees ---
  @Post('employees')
  @Permissions('rh:manage')
  @ApiOperation({ summary: 'Criar colaborador' })
  async createEmployee(@Request() req: any, @Body() dto: CreateEmployeeDto) {
    return this.rhService.createEmployee(req.user.organizationId, dto);
  }

  @Get('employees')
  @Permissions('rh:read')
  @ApiOperation({ summary: 'Listar colaboradores' })
  async getEmployees(@Request() req: any, @Query() filters: any) {
    return this.rhService.getEmployees(req.user.organizationId, filters);
  }

  @Get('employees/:id')
  @Permissions('rh:read')
  @ApiOperation({ summary: 'Buscar colaborador por ID' })
  async getEmployee(@Request() req: any, @Param('id') id: string) {
    return this.rhService.getEmployee(req.user.organizationId, id);
  }

  @Patch('employees/:id')
  @Permissions('rh:manage')
  @ApiOperation({ summary: 'Atualizar colaborador' })
  async updateEmployee(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.rhService.updateEmployee(req.user.organizationId, id, dto);
  }

  @Delete('employees/:id')
  @Permissions('rh:manage')
  @ApiOperation({ summary: 'Remover colaborador' })
  async deleteEmployee(@Request() req: any, @Param('id') id: string) {
    return this.rhService.deleteEmployee(req.user.organizationId, id);
  }

  // --- Time Entries (Ponto) ---
  @Post('employees/:id/time-entries')
  @Permissions('rh:manage')
  @ApiOperation({ summary: 'Registrar ponto' })
  async createTimeEntry(@Request() req: any, @Param('id') employeeId: string, @Body() dto: CreateTimeEntryDto) {
    return this.rhService.createTimeEntry(req.user.organizationId, employeeId, dto);
  }

  @Get('employees/:id/time-entries')
  @Permissions('rh:read')
  @ApiOperation({ summary: 'Listar registros de ponto' })
  async getTimeEntries(@Request() req: any, @Param('id') employeeId: string, @Query() filters: any) {
    return this.rhService.getTimeEntries(req.user.organizationId, employeeId, filters);
  }

  // --- Payroll (Folha) ---
  @Post('employees/:id/payroll')
  @Permissions('rh:manage')
  @ApiOperation({ summary: 'Criar folha de pagamento' })
  async createPayroll(@Request() req: any, @Param('id') employeeId: string, @Body() dto: CreatePayrollDto) {
    return this.rhService.createPayroll(req.user.organizationId, employeeId, dto);
  }

  @Get('employees/:id/payroll')
  @Permissions('rh:read')
  @ApiOperation({ summary: 'Listar folhas de pagamento' })
  async getPayrolls(@Request() req: any, @Param('id') employeeId: string) {
    return this.rhService.getPayrolls(req.user.organizationId, employeeId);
  }

  // --- Leave Requests (Férias/Licenças) ---
  @Post('employees/:id/leaves')
  @Permissions('rh:manage')
  @ApiOperation({ summary: 'Solicitar férias/licença' })
  async createLeaveRequest(@Request() req: any, @Param('id') employeeId: string, @Body() dto: CreateLeaveRequestDto) {
    return this.rhService.createLeaveRequest(req.user.organizationId, employeeId, dto);
  }

  @Get('employees/:id/leaves')
  @Permissions('rh:read')
  @ApiOperation({ summary: 'Listar solicitações de férias/licença' })
  async getLeaveRequests(@Request() req: any, @Param('id') employeeId: string) {
    return this.rhService.getLeaveRequests(req.user.organizationId, employeeId);
  }

  @Patch('leaves/:id/approve')
  @Permissions('rh:manage')
  @ApiOperation({ summary: 'Aprovar solicitação de férias/licença' })
  async approveLeaveRequest(@Request() req: any, @Param('id') id: string) {
    return this.rhService.approveLeaveRequest(req.user.organizationId, id, req.user.id);
  }

  @Patch('leaves/:id/reject')
  @Permissions('rh:manage')
  @ApiOperation({ summary: 'Rejeitar solicitação de férias/licença' })
  async rejectLeaveRequest(@Request() req: any, @Param('id') id: string) {
    return this.rhService.rejectLeaveRequest(req.user.organizationId, id, req.user.id);
  }
}
