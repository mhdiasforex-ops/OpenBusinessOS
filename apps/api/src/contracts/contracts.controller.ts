import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { CreateContractDto, UpdateContractDto } from './contracts.dto';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(JwtGuard, PermissionsGuard)
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Post()
  @Permissions('contracts:manage')
  @ApiOperation({ summary: 'Criar contrato' })
  async createContract(@Request() req: any, @Body() dto: CreateContractDto) {
    return this.contractsService.createContract(req.user.organizationId, dto);
  }

  @Get()
  @Permissions('contracts:read')
  @ApiOperation({ summary: 'Listar contratos' })
  async getContracts(@Request() req: any, @Query() filters: any) {
    return this.contractsService.getContracts(req.user.organizationId, filters);
  }

  @Get(':id')
  @Permissions('contracts:read')
  @ApiOperation({ summary: 'Buscar contrato por ID' })
  async getContract(@Request() req: any, @Param('id') id: string) {
    return this.contractsService.getContract(req.user.organizationId, id);
  }

  @Patch(':id')
  @Permissions('contracts:manage')
  @ApiOperation({ summary: 'Atualizar contrato' })
  async updateContract(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.contractsService.updateContract(req.user.organizationId, id, dto);
  }

  @Delete(':id')
  @Permissions('contracts:manage')
  @ApiOperation({ summary: 'Remover contrato' })
  async deleteContract(@Request() req: any, @Param('id') id: string) {
    return this.contractsService.deleteContract(req.user.organizationId, id);
  }
}
