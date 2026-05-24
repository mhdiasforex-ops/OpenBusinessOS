import { describe, it, expect } from 'vitest';
import { PaymentModule } from './payment.module';

describe('PaymentModule', () => {
  it('should be defined', () => {
    expect(new PaymentModule()).toBeDefined();
  });
});
