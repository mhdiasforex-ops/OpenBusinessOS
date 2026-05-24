import { describe, it, expect } from 'vitest';
import { CreateTransactionItemDto, CreateTransactionDto, UpdateTransactionDto, CashFlowQueryDto, ConciliateItemDto, ConciliateDto } from './financial.dto';

describe('Financial DTOs', () => {
  it('CreateTransactionItemDto should be defined', () => {
    expect(new CreateTransactionItemDto()).toBeDefined();
  });
  it('CreateTransactionDto should be defined', () => {
    expect(new CreateTransactionDto()).toBeDefined();
  });
  it('UpdateTransactionDto should be defined', () => {
    expect(new UpdateTransactionDto()).toBeDefined();
  });
  it('CashFlowQueryDto should be defined', () => {
    expect(new CashFlowQueryDto()).toBeDefined();
  });
  it('ConciliateItemDto should be defined', () => {
    expect(new ConciliateItemDto()).toBeDefined();
  });
  it('ConciliateDto should be defined', () => {
    expect(new ConciliateDto()).toBeDefined();
  });
});
