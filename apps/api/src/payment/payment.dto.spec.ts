import { describe, it, expect } from 'vitest';
import { CreatePaymentConfigDto, CreatePaymentDto, QueryPaymentDto } from './payment.dto';

describe('Payment DTOs', () => {
  it('CreatePaymentConfigDto should be defined', () => {
    expect(new CreatePaymentConfigDto()).toBeDefined();
  });
  it('CreatePaymentDto should be defined', () => {
    expect(new CreatePaymentDto()).toBeDefined();
  });
  it('QueryPaymentDto should be defined', () => {
    expect(new QueryPaymentDto()).toBeDefined();
  });
});
