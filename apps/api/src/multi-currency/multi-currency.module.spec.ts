import { describe, it, expect } from 'vitest';
import { MultiCurrencyModule } from './multi-currency.module';

describe('MultiCurrencyModule', () => {
  it('should be defined', () => {
    expect(new MultiCurrencyModule()).toBeDefined();
  });
});
