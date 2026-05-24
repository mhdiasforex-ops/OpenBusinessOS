import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MultiCurrencyService } from './multi-currency.service';
import { JwtGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/decorators';
import { CreateExchangeRateDto, ConvertDto } from './dto/multi-currency.dto';

@ApiTags('multi-currency')
@ApiBearerAuth()
@Controller('multi-currency')
@UseGuards(JwtGuard, PermissionsGuard)
export class MultiCurrencyController {
  constructor(private multiCurrencyService: MultiCurrencyService) {}

  @Get('rates')
  @Permissions('multi-currency:read')
  @ApiOperation({ summary: 'Listar taxas de câmbio da organização' })
  @ApiResponse({ status: 200, description: 'Lista de taxas de câmbio' })
  async getRates(@Request() req: any) {
    return this.multiCurrencyService.getRates(req.user.organizationId);
  }

  @Post('rates')
  @Permissions('multi-currency:manage')
  @ApiOperation({ summary: 'Adicionar/atualizar taxa de câmbio' })
  @ApiResponse({ status: 201, description: 'Taxa de câmbio registrada' })
  async addRate(@Request() req: any, @Body() dto: CreateExchangeRateDto) {
    return this.multiCurrencyService.addRate(req.user.organizationId, dto);
  }

  @Post('convert')
  @Permissions('multi-currency:read')
  @ApiOperation({ summary: 'Converter valor entre moedas' })
  @ApiResponse({ status: 200, description: 'Valor convertido' })
  async convert(@Request() req: any, @Body() dto: ConvertDto) {
    return this.multiCurrencyService.convert(req.user.organizationId, dto);
  }

  @Post('sync')
  @Permissions('multi-currency:manage')
  @ApiOperation({ summary: 'Sincronizar taxas de câmbio com API externa' })
  @ApiResponse({ status: 200, description: 'Taxas sincronizadas' })
  async syncRates(@Request() req: any) {
    return this.multiCurrencyService.syncRates(req.user.organizationId);
  }

  @Get('currencies')
  @Permissions('multi-currency:read')
  @ApiOperation({ summary: 'Listar moedas suportadas' })
  @ApiResponse({ status: 200, description: 'Lista de moedas suportadas' })
  async getSupportedCurrencies() {
    return this.multiCurrencyService.getSupportedCurrencies();
  }
}
