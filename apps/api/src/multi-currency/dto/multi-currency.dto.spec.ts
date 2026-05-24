import { describe, it, expect } from 'vitest';
import { CreateExchangeRateDto, ConvertDto } from './multi-currency.dto';

describe('MultiCurrency DTOs', () => {
  it('CreateExchangeRateDto should be defined', () => {
    expect(new CreateExchangeRateDto()).toBeDefined();
  });
  it('ConvertDto should be defined', () => {
    expect(new ConvertDto()).toBeDefined();
  });
});
