import { Controller, Get, Post, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NfseService } from './nfse.service';
import { CreateNfseDto, CancelNfseDto } from './dto/nfse.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@ApiTags('NFS-e')
@ApiBearerAuth()
@Controller('nfse')
@UseGuards(JwtGuard, PermissionsGuard)
export class NfseController {
  constructor(private readonly nfseService: NfseService) {}

  @Get()
  @ApiOperation({ summary: 'Listar NFS-e' })
  findAll(@Request() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.nfseService.findAll(req.user.organizationId, +page || 1, +limit || 20);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatisticas NFS-e' })
  getStats(@Request() req: any) {
    return this.nfseService.getStats(req.user.organizationId);
  }

  @Get('cities')
  @ApiOperation({ summary: 'Listar municipios suportados' })
  getCities() {
    return this.nfseService.getCities();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar NFS-e por ID' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.nfseService.findOne(req.user.organizationId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Emitir NFS-e' })
  create(@Request() req: any, @Body() dto: CreateNfseDto) {
    return this.nfseService.create(req.user.organizationId, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar NFS-e' })
  cancel(@Request() req: any, @Param('id') id: string, @Body() dto: CancelNfseDto) {
    return this.nfseService.cancel(req.user.organizationId, id, dto);
  }
}
