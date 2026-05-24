import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesController } from './sales.controller';

describe('SalesController', () => {
  let controller: SalesController;
  let service: any;

  const req = { user: { organizationId: 'org-123', id: 'user-1' } };

  beforeEach(() => {
    service = {
      createOrder: vi.fn().mockResolvedValue({ id: 'ord-1' }),
      getOrders: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      getSalesSummary: vi.fn().mockResolvedValue({ totalSold: 5000 }),
      getOrdersByCustomer: vi.fn().mockResolvedValue({ items: [] }),
      getOrder: vi.fn().mockResolvedValue({ id: 'ord-1' }),
      updateOrder: vi.fn().mockResolvedValue({ id: 'ord-1' }),
      updateOrderStatus: vi.fn().mockResolvedValue({ id: 'ord-1', status: 'CONFIRMED' }),
      deleteOrder: vi.fn().mockResolvedValue({ success: true }),
    };
    controller = new SalesController(service);
  });

  it('should create an order', async () => {
    const dto = { customerId: 'c-1', type: 'SALE' } as any;
    const result = await controller.createOrder(req, dto);
    expect(result).toEqual({ id: 'ord-1' });
    expect(service.createOrder).toHaveBeenCalledWith('org-123', dto, 'user-1');
  });

  it('should list orders', async () => {
    const query = { page: 1 } as any;
    const result = await controller.getOrders(req, query);
    expect(result).toEqual({ items: [], total: 0 });
    expect(service.getOrders).toHaveBeenCalledWith('org-123', query);
  });

  it('should get sales summary', async () => {
    const result = await controller.getSalesSummary(req);
    expect(result).toEqual({ totalSold: 5000 });
    expect(service.getSalesSummary).toHaveBeenCalledWith('org-123');
  });

  it('should get orders by customer', async () => {
    const result = await controller.getOrdersByCustomer(req, 'cust-1');
    expect(result).toEqual({ items: [] });
    expect(service.getOrdersByCustomer).toHaveBeenCalledWith('org-123', 'cust-1');
  });

  it('should get order by id', async () => {
    const result = await controller.getOrder(req, 'ord-1');
    expect(result).toEqual({ id: 'ord-1' });
    expect(service.getOrder).toHaveBeenCalledWith('org-123', 'ord-1');
  });

  it('should update an order', async () => {
    const dto = { notes: 'Updated' } as any;
    const result = await controller.updateOrder(req, 'ord-1', dto);
    expect(result).toEqual({ id: 'ord-1' });
    expect(service.updateOrder).toHaveBeenCalledWith('org-123', 'ord-1', dto);
  });

  it('should update order status', async () => {
    const dto = { status: 'CONFIRMED' } as any;
    const result = await controller.updateOrderStatus(req, 'ord-1', dto);
    expect(result).toEqual({ id: 'ord-1', status: 'CONFIRMED' });
    expect(service.updateOrderStatus).toHaveBeenCalledWith('org-123', 'ord-1', 'CONFIRMED', 'user-1');
  });

  it('should delete an order', async () => {
    const result = await controller.deleteOrder(req, 'ord-1');
    expect(result).toEqual({ success: true });
    expect(service.deleteOrder).toHaveBeenCalledWith('org-123', 'ord-1');
  });
});
