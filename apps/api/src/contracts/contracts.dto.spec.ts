import { describe, it, expect } from 'vitest';
import { CreateContractDto, UpdateContractDto, ContractFiltersDto } from './contracts.dto';

describe('Contracts DTOs', () => {
  it('CreateContractDto should be defined', () => {
    expect(new CreateContractDto()).toBeDefined();
  });
  it('UpdateContractDto should be defined', () => {
    expect(new UpdateContractDto()).toBeDefined();
  });
  it('ContractFiltersDto should be defined', () => {
    expect(new ContractFiltersDto()).toBeDefined();
  });
});
