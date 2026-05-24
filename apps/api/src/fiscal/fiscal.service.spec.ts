import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FiscalService } from './fiscal.service';

describe('FiscalService', () => {
  let service: FiscalService;
  let prisma: any;
  let eventBus: any;

  beforeEach(() => {
    prisma = {};
    eventBus = { emit: vi.fn() };
    service = new FiscalService(prisma, eventBus);
  });

  // ─── Helpers ──────────────────────────────────────────────────────

  describe('gerarChaveAcesso', () => {
    it('should generate a non-empty access key', () => {
      const chave = service['gerarChaveAcesso']('nfe');
      expect(chave.length).toBeGreaterThan(0);
    });

    it('should use modelo 55 for nfe and 65 for nfce', () => {
      const nfe = service['gerarChaveAcesso']('nfe');
      const nfce = service['gerarChaveAcesso']('nfce');
      expect(nfe).toContain('55');
      expect(nfce).toContain('65');
    });

    it('should contain cnpj and random hash', () => {
      const chave = service['gerarChaveAcesso']('nfe');
      expect(chave).toContain('12345678000199');
    });
  });

  // ─── NF-e ─────────────────────────────────────────────────────────

  describe('emitirNFe', () => {
    const dto = {
      numero: 123,
      serie: 1,
      naturezaOperacao: 'VENDA',
      regimeTributario: 'SIMPLES_NACIONAL' as const,
      destinatario: { nome: 'Cliente A', documento: '12345678901' },
      itens: [{ codigo: '001', descricao: 'Produto', ncm: '12345678', unidade: 'UN', quantidade: 1, valorUnitario: 100, valorTotal: 100 }],
      total: 100,
    };

    it('should return authorization with chave, protocolo, qrCode, and xml', async () => {
      const result = await service.emitirNFe(dto);

      expect(result).toMatchObject({
        status: 'autorizado',
        numero: 123,
        serie: 1,
        chave: expect.any(String),
        protocolo: expect.any(String),
        dataHora: expect.any(String),
        qrCode: expect.any(String),
        xml: expect.any(String),
      });
      expect(result.chave.length).toBeGreaterThan(0);
    });

    it('should include the destinatario documento in qrCode', async () => {
      const result = await service.emitirNFe(dto);

      expect(result.qrCode).toContain('cDest=12345678901');
      expect(result.qrCode).toContain('vNF=100.00');
    });

    it('should generate a valid XML with correct numero', async () => {
      const result = await service.emitirNFe(dto);

      expect(result.xml).toContain('<NFe>');
      expect(result.xml).toContain('<cNF>123</cNF>');
      expect(result.xml).toContain('<nNF>123</nNF>');
    });

    it('should generate a unique chave per call', async () => {
      const r1 = await service.emitirNFe(dto);
      const r2 = await service.emitirNFe(dto);

      expect(r1.chave).not.toBe(r2.chave);
    });
  });

  describe('consultarNFe', () => {
    it('should return status autorizado with situacao', async () => {
      const result = await service.consultarNFe('some-chave');

      expect(result).toEqual({ chave: 'some-chave', status: 'autorizado', situacao: 'em uso' });
    });
  });

  describe('cancelarNFe', () => {
    it('should return status cancelado with motivo', async () => {
      const result = await service.cancelarNFe('chave-123', 'Erro na emissão');

      expect(result).toEqual({ chave: 'chave-123', status: 'cancelado', motivo: 'Erro na emissão' });
    });
  });

  describe('inutilizarNFe', () => {
    it('should return status inutilizado with motivo', async () => {
      const result = await service.inutilizarNFe('chave-123', 'Numeração incorreta');

      expect(result).toEqual({ chave: 'chave-123', status: 'inutilizado', motivo: 'Numeração incorreta' });
    });
  });

  describe('gerarCertidaoNegativa', () => {
    it('should return status positiva', async () => {
      const result = await service.gerarCertidaoNegativa();

      expect(result).toEqual({ status: 'positiva', mensagem: 'Nenhuma irregularidade encontrada' });
    });
  });

  // ─── NFC-e ────────────────────────────────────────────────────────

  describe('emitirNFCe', () => {
    const dto = {
      numero: 456,
      serie: 2,
      itens: [],
      total: 199.9,
    };

    it('should return authorization with chave, pdf, and qrCode', async () => {
      const result = await service.emitirNFCe(dto);

      expect(result).toMatchObject({
        status: 'autorizado',
        chave: expect.any(String),
        numero: 456,
        serie: 2,
        pdf: expect.stringContaining('https://api.dfe.com/nfce/pdf/'),
        qrCode: expect.stringContaining('https://www.sefaz.rs.gov.br/nfce/consulta'),
      });
    });

    it('should generate unique chave per call', async () => {
      const r1 = await service.emitirNFCe(dto);
      const r2 = await service.emitirNFCe(dto);

      expect(r1.chave).not.toBe(r2.chave);
    });
  });

  describe('consultarNFCe', () => {
    it('should return status autorizado', async () => {
      const result = await service.consultarNFCe('chave-nfce');

      expect(result).toEqual({ chave: 'chave-nfce', status: 'autorizado' });
    });
  });

  // ─── NFS-e ────────────────────────────────────────────────────────

  describe('emitirNFSe', () => {
    const dto = {
      prestador: { nome: 'Empresa X', documento: '12345678000199', inscricaoMunicipal: '12345', municipio: 'São Paulo', uf: 'SP' },
      tomador: { nome: 'Cliente B' },
      descricaoServico: 'Consultoria',
      itemListaServico: '01.01',
      codigoCnae: '6202300',
      valorServico: 5000,
      baseCalculo: 5000,
      aliquotaIss: 5,
      valorIss: 250,
    };

    it('should return sucesso with numero, link, pdf, and xml', async () => {
      const result = await service.emitirNFSe(dto);

      expect(result).toMatchObject({
        status: 'sucesso',
        numero: expect.any(String),
        link: expect.stringContaining('https://nfe.prefeitura.gov.br/nfse/'),
        pdf: expect.stringContaining('https://nfe.prefeitura.gov.br/nfse/pdf/'),
        xml: expect.stringContaining('<?xml version="1.0" encoding="UTF-8"?>'),
      });
    });

    it('should generate a random numero each time', async () => {
      const r1 = await service.emitirNFSe(dto);
      const r2 = await service.emitirNFSe(dto);

      expect(r1.numero).not.toBe(r2.numero);
    });
  });

  describe('consultarNFSe', () => {
    it('should return status autorizada', async () => {
      const result = await service.consultarNFSe('123456');

      expect(result).toEqual({ numero: '123456', status: 'autorizada' });
    });
  });

  describe('cancelarNFSe', () => {
    it('should return status cancelada with motivo', async () => {
      const result = await service.cancelarNFSe('123456', 'Serviço não realizado');

      expect(result).toEqual({ numero: '123456', status: 'cancelada', motivo: 'Serviço não realizado' });
    });
  });

  // ─── SPED ─────────────────────────────────────────────────────────

  describe('gerarSPED', () => {
    it('should generate SPED file content for given tipo and periodo', async () => {
      const result = await service.gerarSPED('ICMS', '2026/05');

      expect(result).toMatchObject({
        tipo: 'ICMS',
        periodo: '2026/05',
        arquivo: 'SPED_ICMS_202605.txt',
        conteudo: expect.any(String),
        registros: expect.any(Number),
      });
      expect(result.conteudo).toContain('|0000|');
    });

    it('should contain organization data in SPED content', async () => {
      const result = await service.gerarSPED('ICMS', '2026/05');

      expect(result.conteudo).toContain('BusinessOS');
      expect(result.conteudo).toContain('12345678000199');
    });
  });

  describe('importarSPED', () => {
    it('should return importado status', async () => {
      const result = await service.importarSPED('ICMS', 'SPED_ICMS_202605.txt');

      expect(result).toEqual({ tipo: 'ICMS', arquivo: 'SPED_ICMS_202605.txt', status: 'importado' });
    });
  });

  // ─── Relatórios ───────────────────────────────────────────────────

  describe('gerarResumoFiscal', () => {
    it('should return summary with zero defaults', async () => {
      const result = await service.gerarResumoFiscal('2026/05');

      expect(result).toEqual({ periodo: '2026/05', totalNotas: 0, totalImpostos: 0, saldoCredito: 0 });
    });
  });

  describe('gerarMapaFiscal', () => {
    it('should return empty aliquota and receita objects', async () => {
      const result = await service.gerarMapaFiscal('2026/05');

      expect(result).toEqual({ periodo: '2026/05', aliquotas: {}, receitas: {} });
    });
  });

  // ─── CT-e / MD-Fe ─────────────────────────────────────────────────

  describe('emitirCTe', () => {
    it('should return autorizado with chave', async () => {
      const dto = { numero: 789, serie: 1, tomador: { nome: 'Transportado' } };
      const result = await service.emitirCTe(dto);

      expect(result).toMatchObject({ status: 'autorizado', chave: expect.any(String) });
      expect(result.chave.length).toBeGreaterThan(0);
    });
  });

  describe('consultarCTe', () => {
    it('should return status autorizado', async () => {
      const result = await service.consultarCTe('cte-chave');

      expect(result).toEqual({ chave: 'cte-chave', status: 'autorizado' });
    });
  });

  describe('emitirMDFe', () => {
    it('should return autorizado with chave', async () => {
      const dto = { numero: 101, serie: 1 };
      const result = await service.emitirMDFe(dto);

      expect(result).toMatchObject({ status: 'autorizado', chave: expect.any(String) });
      expect(result.chave.length).toBeGreaterThan(0);
    });
  });

  describe('consultarMDFe', () => {
    it('should return status autorizado', async () => {
      const result = await service.consultarMDFe('mdfe-chave');

      expect(result).toEqual({ chave: 'mdfe-chave', status: 'autorizado' });
    });
  });

  // ─── All operations log via Logger ─────────────────────────────────

  describe('logger', () => {
    it('should have FiscalService as logger context', () => {
      expect(service['logger'].context).toBe('FiscalService');
    });
  });
});
