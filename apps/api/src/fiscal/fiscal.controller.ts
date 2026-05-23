import { Controller, Get, Post, Body, Param, Delete, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FiscalService } from './fiscal.service';
import { EmitirNFeDto, EmitirNFCeDto, EmitirNFSeDto, ConsultarDocFiscalDto } from './fiscal.dto';

@ApiTags('fiscal')
@Controller('fiscal')
@ApiBearerAuth()
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  // ─── NF-e ──────────────────────────────────────────────────────
  @Post('nfe/emitir')
  async emitirNFe(@Body() dto: EmitirNFeDto) {
    return this.fiscalService.emitirNFe(dto);
  }

  @Get('nfe/:chave')
  async consultarNFe(@Param('chave') chave: string) {
    return this.fiscalService.consultarNFe(chave);
  }

  @Post('nfe/:chave/cancelar')
  async cancelarNFe(@Param('chave') chave: string, @Body('motivo') motivo: string) {
    return this.fiscalService.cancelarNFe(chave, motivo);
  }

  @Post('nfe/:chave/inutilizar')
  async inutilizarNFe(@Param('chave') chave: string, @Body('motivo') motivo: string) {
    return this.fiscalService.inutilizarNFe(chave, motivo);
  }

  @Get('nfe/certidao/negativa')
  async certidaoNegativa() {
    return this.fiscalService.gerarCertidaoNegativa();
  }

  // ─── NFC-e ─────────────────────────────────────────────────────
  @Post('nfce/emitir')
  async emitirNFCe(@Body() dto: EmitirNFCeDto) {
    return this.fiscalService.emitirNFCe(dto);
  }

  @Get('nfce/:chave')
  async consultarNFCe(@Param('chave') chave: string) {
    return this.fiscalService.consultarNFCe(chave);
  }

  // ─── NFS-e ─────────────────────────────────────────────────────
  @Post('nfse/emitir')
  async emitirNFSe(@Body() dto: EmitirNFSeDto) {
    return this.fiscalService.emitirNFSe(dto);
  }

  @Get('nfse/:numero')
  async consultarNFSe(@Param('numero') numero: string) {
    return this.fiscalService.consultarNFSe(numero);
  }

  @Post('nfse/:numero/cancelar')
  async cancelarNFSe(@Param('numero') numero: string, @Body('motivo') motivo: string) {
    return this.fiscalService.cancelarNFSe(numero, motivo);
  }

  // ─── SPED ──────────────────────────────────────────────────────
  @Get('sped/:tipo')
  async gerarSPED(@Param('tipo') tipo: string, @Query('periodo') periodo: string) {
    return this.fiscalService.gerarSPED(tipo, periodo);
  }

  @Post('sped/:tipo/importar')
  async importarSPED(@Param('tipo') tipo: string, @Body('arquivo') arquivo: string) {
    return this.fiscalService.importarSPED(tipo, arquivo);
  }

  // ─── Relatórios ────────────────────────────────────────────────
  @Get('relatorios/resumo-fiscal')
  async resumoFiscal(@Query('periodo') periodo: string) {
    return this.fiscalService.gerarResumoFiscal(periodo);
  }

  @Get('relatorios/mapa-fiscal')
  async mapaFiscal(@Query('periodo') periodo: string) {
    return this.fiscalService.gerarMapaFiscal(periodo);
  }

  // ─── CT-e / MDF-e ──────────────────────────────────────────────
  @Post('cte/emitir')
  async emitirCTe(@Body() dto: any) {
    return this.fiscalService.emitirCTe(dto);
  }

  @Get('cte/:chave')
  async consultarCTe(@Param('chave') chave: string) {
    return this.fiscalService.consultarCTe(chave);
  }

  @Post('mdfe/emitir')
  async emitirMDFe(@Body() dto: any) {
    return this.fiscalService.emitirMDFe(dto);
  }

  @Get('mdfe/:chave')
  async consultarMDFe(@Param('chave') chave: string) {
    return this.fiscalService.consultarMDFe(chave);
  }
}
