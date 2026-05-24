import { describe, it, expect } from 'vitest';
import { FinancialModule } from './financial.module';

describe('FinancialModule', () => {
  it('should be defined', () => {
    expect(new FinancialModule()).toBeDefined();
  });
});
