import { describe, it, expect } from 'vitest';
import { NfseModule } from './nfse.module';

describe('NfseModule', () => {
  it('should be defined', () => {
    expect(new NfseModule()).toBeDefined();
  });
});
