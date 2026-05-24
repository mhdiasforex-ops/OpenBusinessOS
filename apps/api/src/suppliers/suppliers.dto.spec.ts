import { describe, it, expect } from 'vitest';
import { CreateSupplierDto, UpdateSupplierDto, SupplierFiltersDto } from './suppliers.dto';

describe('Suppliers DTOs', () => {
  it('CreateSupplierDto should be defined', () => {
    expect(new CreateSupplierDto()).toBeDefined();
  });
  it('UpdateSupplierDto should be defined', () => {
    expect(new UpdateSupplierDto()).toBeDefined();
  });
  it('SupplierFiltersDto should be defined', () => {
    expect(new SupplierFiltersDto()).toBeDefined();
  });
});
