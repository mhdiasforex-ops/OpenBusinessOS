import { describe, it, expect } from 'vitest';
import { CreateNfseDto, CancelNfseDto } from './nfse.dto';

describe('Nfse DTOs', () => {
  it('CreateNfseDto should be defined', () => {
    expect(new CreateNfseDto()).toBeDefined();
  });
  it('CancelNfseDto should be defined', () => {
    expect(new CancelNfseDto()).toBeDefined();
  });
});
