import { describe, it, expect } from 'vitest';
import { DestinatarioDto, ItemNFeDto, EmitirNFeDto, EmitirNFCeDto, PrestadorDto, EmitirNFSeDto, ConsultarDocFiscalDto } from './fiscal.dto';

describe('Fiscal DTOs', () => {
  it('DestinatarioDto should be defined', () => {
    expect(new DestinatarioDto()).toBeDefined();
  });
  it('ItemNFeDto should be defined', () => {
    expect(new ItemNFeDto()).toBeDefined();
  });
  it('EmitirNFeDto should be defined', () => {
    expect(new EmitirNFeDto()).toBeDefined();
  });
  it('EmitirNFCeDto should be defined', () => {
    expect(new EmitirNFCeDto()).toBeDefined();
  });
  it('PrestadorDto should be defined', () => {
    expect(new PrestadorDto()).toBeDefined();
  });
  it('EmitirNFSeDto should be defined', () => {
    expect(new EmitirNFSeDto()).toBeDefined();
  });
  it('ConsultarDocFiscalDto should be defined', () => {
    expect(new ConsultarDocFiscalDto()).toBeDefined();
  });
});
