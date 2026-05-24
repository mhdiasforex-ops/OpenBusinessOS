import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FiscalController } from './fiscal.controller';

describe('FiscalController', () => {
  let controller: FiscalController;
  let fiscalService: any;

  beforeEach(() => {
    fiscalService = {
      emitirNFe: vi.fn().mockResolvedValue({ chave: 'nfe-key-1' }),
      consultarNFe: vi.fn().mockResolvedValue({ chave: 'nfe-key-1', status: 'AUTHORIZED' }),
      cancelarNFe: vi.fn().mockResolvedValue({ success: true }),
      inutilizarNFe: vi.fn().mockResolvedValue({ success: true }),
      gerarCertidaoNegativa: vi.fn().mockResolvedValue({ pdfUrl: 'cert.pdf' }),
      emitirNFCe: vi.fn().mockResolvedValue({ chave: 'nfce-key-1' }),
      consultarNFCe: vi.fn().mockResolvedValue({ chave: 'nfce-key-1', status: 'AUTHORIZED' }),
      emitirNFSe: vi.fn().mockResolvedValue({ numero: 'nfse-1' }),
      consultarNFSe: vi.fn().mockResolvedValue({ numero: 'nfse-1', status: 'ISSUED' }),
      cancelarNFSe: vi.fn().mockResolvedValue({ success: true }),
      gerarSPED: vi.fn().mockResolvedValue({ arquivo: 'sped.txt' }),
      importarSPED: vi.fn().mockResolvedValue({ success: true }),
      gerarResumoFiscal: vi.fn().mockResolvedValue({ receita: 50000 }),
      gerarMapaFiscal: vi.fn().mockResolvedValue({ icms: 2000 }),
      emitirCTe: vi.fn().mockResolvedValue({ chave: 'cte-key-1' }),
      consultarCTe: vi.fn().mockResolvedValue({ chave: 'cte-key-1', status: 'AUTHORIZED' }),
      emitirMDFe: vi.fn().mockResolvedValue({ chave: 'mdfe-key-1' }),
      consultarMDFe: vi.fn().mockResolvedValue({ chave: 'mdfe-key-1', status: 'AUTHORIZED' }),
    };
    controller = new FiscalController(fiscalService);
  });

  it('should call emitirNFe with dto', async () => {
    const dto = { cnpj: '12345678000199', produtos: [] };
    const result = await controller.emitirNFe(dto);
    expect(fiscalService.emitirNFe).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ chave: 'nfe-key-1' });
  });

  it('should call consultarNFe with chave', async () => {
    const result = await controller.consultarNFe('nfe-key-1');
    expect(fiscalService.consultarNFe).toHaveBeenCalledWith('nfe-key-1');
    expect(result).toEqual({ chave: 'nfe-key-1', status: 'AUTHORIZED' });
  });

  it('should call cancelarNFe with chave and motivo', async () => {
    const result = await controller.cancelarNFe('nfe-key-1', 'Erro na emissão');
    expect(fiscalService.cancelarNFe).toHaveBeenCalledWith('nfe-key-1', 'Erro na emissão');
    expect(result).toEqual({ success: true });
  });

  it('should call inutilizarNFe with chave and motivo', async () => {
    const result = await controller.inutilizarNFe('nfe-key-1', 'Numeração incorreta');
    expect(fiscalService.inutilizarNFe).toHaveBeenCalledWith('nfe-key-1', 'Numeração incorreta');
    expect(result).toEqual({ success: true });
  });

  it('should call gerarCertidaoNegativa', async () => {
    const result = await controller.certidaoNegativa();
    expect(fiscalService.gerarCertidaoNegativa).toHaveBeenCalledWith();
    expect(result).toEqual({ pdfUrl: 'cert.pdf' });
  });

  it('should call emitirNFCe with dto', async () => {
    const dto = { cnpj: '12345678000199', itens: [] };
    const result = await controller.emitirNFCe(dto);
    expect(fiscalService.emitirNFCe).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ chave: 'nfce-key-1' });
  });

  it('should call consultarNFCe with chave', async () => {
    const result = await controller.consultarNFCe('nfce-key-1');
    expect(fiscalService.consultarNFCe).toHaveBeenCalledWith('nfce-key-1');
    expect(result).toEqual({ chave: 'nfce-key-1', status: 'AUTHORIZED' });
  });

  it('should call emitirNFSe with dto', async () => {
    const dto = { cnpj: '12345678000199', servico: 'Consultoria' };
    const result = await controller.emitirNFSe(dto);
    expect(fiscalService.emitirNFSe).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ numero: 'nfse-1' });
  });

  it('should call consultarNFSe with numero', async () => {
    const result = await controller.consultarNFSe('nfse-1');
    expect(fiscalService.consultarNFSe).toHaveBeenCalledWith('nfse-1');
    expect(result).toEqual({ numero: 'nfse-1', status: 'ISSUED' });
  });

  it('should call cancelarNFSe with numero and motivo', async () => {
    const result = await controller.cancelarNFSe('nfse-1', 'Serviço cancelado');
    expect(fiscalService.cancelarNFSe).toHaveBeenCalledWith('nfse-1', 'Serviço cancelado');
    expect(result).toEqual({ success: true });
  });

  it('should call gerarSPED with tipo and periodo', async () => {
    const result = await controller.gerarSPED('ICMS', '2024-01');
    expect(fiscalService.gerarSPED).toHaveBeenCalledWith('ICMS', '2024-01');
    expect(result).toEqual({ arquivo: 'sped.txt' });
  });

  it('should call importarSPED with tipo and arquivo', async () => {
    const result = await controller.importarSPED('ICMS', 'sped_data.txt');
    expect(fiscalService.importarSPED).toHaveBeenCalledWith('ICMS', 'sped_data.txt');
    expect(result).toEqual({ success: true });
  });

  it('should call gerarResumoFiscal with periodo', async () => {
    const result = await controller.resumoFiscal('2024-01');
    expect(fiscalService.gerarResumoFiscal).toHaveBeenCalledWith('2024-01');
    expect(result).toEqual({ receita: 50000 });
  });

  it('should call gerarMapaFiscal with periodo', async () => {
    const result = await controller.mapaFiscal('2024-01');
    expect(fiscalService.gerarMapaFiscal).toHaveBeenCalledWith('2024-01');
    expect(result).toEqual({ icms: 2000 });
  });

  it('should call emitirCTe with dto', async () => {
    const dto = { cnpj: '12345678000199', carga: {} };
    const result = await controller.emitirCTe(dto);
    expect(fiscalService.emitirCTe).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ chave: 'cte-key-1' });
  });

  it('should call consultarCTe with chave', async () => {
    const result = await controller.consultarCTe('cte-key-1');
    expect(fiscalService.consultarCTe).toHaveBeenCalledWith('cte-key-1');
    expect(result).toEqual({ chave: 'cte-key-1', status: 'AUTHORIZED' });
  });

  it('should call emitirMDFe with dto', async () => {
    const dto = { cnpj: '12345678000199', veiculo: {} };
    const result = await controller.emitirMDFe(dto);
    expect(fiscalService.emitirMDFe).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ chave: 'mdfe-key-1' });
  });

  it('should call consultarMDFe with chave', async () => {
    const result = await controller.consultarMDFe('mdfe-key-1');
    expect(fiscalService.consultarMDFe).toHaveBeenCalledWith('mdfe-key-1');
    expect(result).toEqual({ chave: 'mdfe-key-1', status: 'AUTHORIZED' });
  });
});
