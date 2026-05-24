import { describe, it, expect } from 'vitest';
import { CreateStockMovementDto, CreateSupplierDto, UpdateSupplierDto, PurchaseOrderItemDto, CreatePurchaseOrderDto } from './inventory.dto';

describe('Inventory DTOs', () => {
  it('CreateStockMovementDto should be defined', () => {
    expect(new CreateStockMovementDto()).toBeDefined();
  });
  it('CreateSupplierDto should be defined', () => {
    expect(new CreateSupplierDto()).toBeDefined();
  });
  it('UpdateSupplierDto should be defined', () => {
    expect(new UpdateSupplierDto()).toBeDefined();
  });
  it('PurchaseOrderItemDto should be defined', () => {
    expect(new PurchaseOrderItemDto()).toBeDefined();
  });
  it('CreatePurchaseOrderDto should be defined', () => {
    expect(new CreatePurchaseOrderDto()).toBeDefined();
  });
});
