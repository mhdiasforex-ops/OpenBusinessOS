import { describe, it, expect } from 'vitest';
import { FiscalModule } from './fiscal.module';

describe('FiscalModule', () => {
  it('should be defined', () => {
    expect(new FiscalModule()).toBeDefined();
  });
});
