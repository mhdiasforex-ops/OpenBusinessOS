import { describe, it, expect } from 'vitest';
import { OrderItemDto, CreateOrderDto, UpdateOrderDto, OrderListQueryDto, UpdateOrderStatusDto } from './sales.dto';

describe('Sales DTOs', () => {
  it('OrderItemDto should be defined', () => {
    expect(new OrderItemDto()).toBeDefined();
  });
  it('CreateOrderDto should be defined', () => {
    expect(new CreateOrderDto()).toBeDefined();
  });
  it('UpdateOrderDto should be defined', () => {
    expect(new UpdateOrderDto()).toBeDefined();
  });
  it('OrderListQueryDto should be defined', () => {
    expect(new OrderListQueryDto()).toBeDefined();
  });
  it('UpdateOrderStatusDto should be defined', () => {
    expect(new UpdateOrderStatusDto()).toBeDefined();
  });
});
