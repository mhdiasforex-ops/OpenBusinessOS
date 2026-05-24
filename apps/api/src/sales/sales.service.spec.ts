import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { EventTypes } from '@openbusinessos/event-definitions';
import { NotFoundException } from '@nestjs/common';

describe('SalesService', () => {
  let service: SalesService;
  let prisma: any;
  let eventBus: any;

  const orgId = 'org-123';
  const userId = 'user-1';

  beforeEach(() => {
    prisma = {
      order: {
        findFirst: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        groupBy: vi.fn(),
      },
    };
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) };
    service = new SalesService(
      prisma as unknown as PrismaService,
      eventBus as unknown as EventBusService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── generateOrderNumber ────────────────────────────────────────────

  describe('generateOrderNumber', () => {
    it('should generate PED-00001 for first SALE order', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await service['generateOrderNumber'](orgId, 'SALE');

      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { organizationId: orgId, number: { startsWith: 'PED-' } },
        orderBy: { createdAt: 'desc' },
        select: { number: true },
      });
      expect(result).toBe('PED-00001');
    });

    it('should generate QTN-00001 for first QUOTE order', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await service['generateOrderNumber'](orgId, 'QUOTE');

      expect(result).toBe('QTN-00001');
    });

    it('should generate PRP-00001 for first PROPOSAL order', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await service['generateOrderNumber'](orgId, 'PROPOSAL');

      expect(result).toBe('PRP-00001');
    });

    it('should increment from last order number', async () => {
      prisma.order.findFirst.mockResolvedValue({ number: 'PED-00005' });

      const result = await service['generateOrderNumber'](orgId, 'SALE');

      expect(result).toBe('PED-00006');
    });

    it('should handle large sequence numbers', async () => {
      prisma.order.findFirst.mockResolvedValue({ number: 'QTN-99999' });

      const result = await service['generateOrderNumber'](orgId, 'QUOTE');

      expect(result).toBe('QTN-100000');
    });

    it('should fall back to 00001 when last order number format is invalid', async () => {
      prisma.order.findFirst.mockResolvedValue({ number: 'PED-abc' });

      const result = await service['generateOrderNumber'](orgId, 'SALE');

      expect(result).toBe('PED-00001');
    });

    it('should fall back to 00001 when last order number has no dash', async () => {
      prisma.order.findFirst.mockResolvedValue({ number: 'PED12345' });

      const result = await service['generateOrderNumber'](orgId, 'SALE');

      expect(result).toBe('PED-00001');
    });

    it('should query with correct prefix per type', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await service['generateOrderNumber'](orgId, 'PROPOSAL');

      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ number: { startsWith: 'PRP-' } }) }),
      );
    });
  });

  // ── createOrder ────────────────────────────────────────────────────

  describe('createOrder', () => {
    const createDto = {
      customerId: 'cust-1',
      type: 'SALE',
      items: [{ productId: 'prod-1', quantity: 2, unitPrice: 49.9, total: 99.8 }],
      subtotal: 199.8,
      discount: 20,
      notes: 'Entregar até sexta',
      dueDate: '2026-06-30',
    };

    const createdOrder = {
      id: 'order-1',
      organizationId: orgId,
      customerId: 'cust-1',
      number: 'PED-00001',
      type: 'SALE',
      status: 'DRAFT',
      items: [{ productId: 'prod-1', quantity: 2, unitPrice: 49.9, total: 99.8 }],
      subtotal: 199.8,
      discount: 20,
      total: 179.8,
      notes: 'Entregar até sexta',
      dueDate: new Date('2026-06-30'),
      deliveredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: 'cust-1', name: 'Cliente A', email: 'cliente@test.com' },
    };

    it('should generate order number, calculate total, create order, and emit event', async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      prisma.order.create.mockResolvedValue(createdOrder);

      const result = await service.createOrder(orgId, createDto, userId);

      expect(prisma.order.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          customerId: 'cust-1',
          number: 'PED-00001',
          type: 'SALE',
          status: 'DRAFT',
          items: [{ productId: 'prod-1', quantity: 2, unitPrice: 49.9, total: 99.8 }],
          subtotal: 199.8,
          discount: 20,
          total: 179.8,
          notes: 'Entregar até sexta',
          dueDate: new Date('2026-06-30'),
        },
        include: { customer: true },
      });

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: EventTypes.ORDER_CREATED,
        source: 'sales-service',
        payload: {
          orderId: 'order-1',
          number: 'PED-00001',
          type: 'SALE',
          customerId: 'cust-1',
          total: 179.8,
          userId,
        },
      });

      expect(result).toEqual(createdOrder);
    });

    it('should default discount to 0 when not provided', async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      prisma.order.create.mockImplementation((_: any) =>
        Promise.resolve({ ...createdOrder, discount: 0, total: 199.8, ..._.data }),
      );

      const result = await service.createOrder(orgId, {
        customerId: 'cust-1',
        type: 'SALE',
        items: [{ productId: 'prod-1', quantity: 1, unitPrice: 199.8, total: 199.8 }],
        subtotal: 199.8,
      }, userId);

      expect(result.total).toBe(199.8);
    });

    it('should set dueDate to null when not provided', async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      prisma.order.create.mockImplementation((_: any) => Promise.resolve({ ...createdOrder, ..._.data }));

      await service.createOrder(orgId, {
        customerId: 'cust-1',
        type: 'SALE',
        items: [],
        subtotal: 0,
      }, userId);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ dueDate: null }) }),
      );
    });

    it('should handle QUOTE type orders', async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      const quoteOrder = { ...createdOrder, number: 'QTN-00001', type: 'QUOTE' };
      prisma.order.create.mockResolvedValue(quoteOrder);

      const result = await service.createOrder(orgId, { ...createDto, type: 'QUOTE' }, userId);

      expect(result.number).toBe('QTN-00001');
      expect(result.type).toBe('QUOTE');
    });
  });

  // ── getOrders ──────────────────────────────────────────────────────

  describe('getOrders', () => {
    it('should return paginated orders with default values', async () => {
      const orders = [{ id: 'order-1', customer: { id: 'cust-1', name: 'Cliente', email: 'c@t.com' } }];
      prisma.order.findMany.mockResolvedValue(orders);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.getOrders(orgId, {});

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 25,
        include: { customer: { select: { id: true, name: true, email: true } } },
      });
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: { organizationId: orgId },
      });
      expect(result).toEqual({
        data: orders,
        total: 1,
        page: 1,
        perPage: 25,
        totalPages: 1,
      });
    });

    it('should apply status, type, and customerId filters', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.getOrders(orgId, {
        status: 'CONFIRMED',
        type: 'SALE',
        customerId: 'cust-1',
        page: 2,
        perPage: 10,
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          status: 'CONFIRMED',
          type: 'SALE',
          customerId: 'cust-1',
        },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
        include: { customer: { select: { id: true, name: true, email: true } } },
      });
    });

    it('should calculate totalPages correctly', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(57);

      const result = await service.getOrders(orgId, { perPage: 10 });

      expect(result.totalPages).toBe(6); // 57 / 10 = 5.7 -> 6
    });

    it('should return empty array when no orders', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      const result = await service.getOrders(orgId, {});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ── getOrder ───────────────────────────────────────────────────────

  describe('getOrder', () => {
    it('should return order with customer and org when found', async () => {
      const order = {
        id: 'order-1',
        organizationId: orgId,
        customer: { id: 'cust-1', name: 'Cliente' },
        organization: { id: orgId, name: 'Org' },
      };
      prisma.order.findFirst.mockResolvedValue(order);

      const result = await service.getOrder(orgId, 'order-1');

      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: 'order-1', organizationId: orgId },
        include: { customer: true, organization: { select: { id: true, name: true } } },
      });
      expect(result).toEqual(order);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.getOrder(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when order belongs to another org', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.getOrder(orgId, 'order-other-org')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateOrder ────────────────────────────────────────────────────

  describe('updateOrder', () => {
    const existingOrder = {
      id: 'order-1',
      organizationId: orgId,
      customerId: 'cust-1',
      number: 'PED-00001',
      type: 'SALE',
      status: 'DRAFT',
      items: [],
      subtotal: 200,
      discount: 0,
      total: 200,
      notes: null,
      dueDate: null,
      deliveredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should verify order exists, update fields, recalculate total, and emit event', async () => {
      prisma.order.findFirst.mockResolvedValue(existingOrder);
      const updated = {
        ...existingOrder,
        customerId: 'cust-2',
        subtotal: 300,
        discount: 50,
        total: 250,
        notes: 'Nota atualizada',
        customer: { id: 'cust-2', name: 'Outro Cliente' },
      };
      prisma.order.update.mockResolvedValue(updated);

      const result = await service.updateOrder(orgId, 'order-1', {
        customerId: 'cust-2',
        subtotal: 300,
        discount: 50,
        notes: 'Nota atualizada',
      });

      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: 'order-1', organizationId: orgId },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          customerId: 'cust-2',
          type: undefined,
          items: undefined,
          subtotal: 300,
          discount: 50,
          total: 250,
          notes: 'Nota atualizada',
          dueDate: undefined,
        },
        include: { customer: true },
      });

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: EventTypes.ORDER_UPDATED,
        source: 'sales-service',
        payload: {
          orderId: 'order-1',
          number: 'PED-00001',
          type: 'SALE',
          updatedFields: ['customerId', 'subtotal', 'discount', 'notes'],
        },
      });

      expect(result).toEqual(updated);
    });

    it('should use existing subtotal and discount when not provided, calculating total from existing', async () => {
      prisma.order.findFirst.mockResolvedValue(existingOrder);
      prisma.order.update.mockResolvedValue({ ...existingOrder, total: 200, customer: {} });

      await service.updateOrder(orgId, 'order-1', { notes: 'Apenas nota' });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ total: 200 }),
        }),
      );
    });

    it('should convert type string to OrderType enum when provided', async () => {
      prisma.order.findFirst.mockResolvedValue(existingOrder);
      prisma.order.update.mockImplementation((_: any) => Promise.resolve(_.data));

      await service.updateOrder(orgId, 'order-1', { type: 'QUOTE' });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'QUOTE' }) }),
      );
    });

    it('should convert dueDate string to Date when provided', async () => {
      prisma.order.findFirst.mockResolvedValue(existingOrder);
      prisma.order.update.mockImplementation((_: any) => Promise.resolve(_.data));

      await service.updateOrder(orgId, 'order-1', { dueDate: '2026-08-15' });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ dueDate: new Date('2026-08-15') }),
        }),
      );
    });

    it('should throw NotFoundException when order does not exist', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.updateOrder(orgId, 'nonexistent', { notes: 'test' }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalled();
    });
  });

  // ── updateOrderStatus ──────────────────────────────────────────────

  describe('updateOrderStatus', () => {
    const baseOrder = {
      id: 'order-1',
      organizationId: orgId,
      customerId: 'cust-1',
      number: 'PED-00001',
      type: 'SALE',
      status: 'DRAFT',
      items: [],
      subtotal: 200,
      discount: 0,
      total: 200,
      notes: null,
      dueDate: null,
      deliveredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should verify order exists and update status', async () => {
      prisma.order.findFirst.mockResolvedValue(baseOrder);
      const updated = { ...baseOrder, status: 'CONFIRMED', customer: { id: 'cust-1' } };
      prisma.order.update.mockResolvedValue(updated);

      const result = await service.updateOrderStatus(orgId, 'order-1', 'CONFIRMED', userId);

      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: 'order-1', organizationId: orgId },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'CONFIRMED' },
        include: { customer: true },
      });
      expect(result).toEqual(updated);
    });

    it('should set deliveredAt when status is DELIVERED', async () => {
      prisma.order.findFirst.mockResolvedValue({ ...baseOrder, status: 'SHIPPED' });
      const updated = { ...baseOrder, status: 'DELIVERED', deliveredAt: new Date(), customer: { id: 'cust-1' } };
      prisma.order.update.mockResolvedValue(updated);

      await service.updateOrderStatus(orgId, 'order-1', 'DELIVERED', userId);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'DELIVERED', deliveredAt: expect.any(Date) },
        include: { customer: true },
      });
    });

    it('should emit ORDER_STATUS_CHANGED event', async () => {
      prisma.order.findFirst.mockResolvedValue(baseOrder);
      const updated = { ...baseOrder, status: 'CONFIRMED', customer: { id: 'cust-1' } };
      prisma.order.update.mockResolvedValue(updated);

      await service.updateOrderStatus(orgId, 'order-1', 'CONFIRMED', userId);

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: EventTypes.ORDER_STATUS_CHANGED,
        source: 'sales-service',
        payload: {
          orderId: 'order-1',
          number: 'PED-00001',
          previousStatus: 'DRAFT',
          newStatus: 'CONFIRMED',
          userId,
        },
      });
    });

    it('should convert QUOTE to SALE when status changes to CONFIRMED', async () => {
      const quoteOrder = { ...baseOrder, number: 'QTN-00001', type: 'QUOTE', status: 'DRAFT' };
      prisma.order.findFirst.mockResolvedValue(quoteOrder);
      prisma.order.update.mockResolvedValueOnce({ ...quoteOrder, status: 'CONFIRMED', customer: { id: 'cust-1' } });
      const convertedOrder = { ...quoteOrder, type: 'SALE', status: 'CONFIRMED', number: 'QTN-00001', customer: { id: 'cust-1' } };
      prisma.order.update.mockResolvedValueOnce(convertedOrder);

      const result = await service.updateOrderStatus(orgId, 'order-1', 'CONFIRMED', userId);

      // First update: status change
      expect(prisma.order.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'order-1' },
        data: { status: 'CONFIRMED' },
        include: { customer: true },
      });

      // Second update: convert type to SALE
      expect(prisma.order.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'order-1' },
        data: { type: 'SALE' },
        include: { customer: true },
      });

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: EventTypes.QUOTE_CONVERTED,
        source: 'sales-service',
        payload: {
          orderId: 'order-1',
          number: 'QTN-00001',
          customerId: 'cust-1',
          total: 200,
          userId,
        },
      });

      expect(result.type).toBe('SALE');
    });

    it('should NOT convert PROPOSAL to SALE on CONFIRMED (only QUOTE)', async () => {
      const proposalOrder = { ...baseOrder, type: 'PROPOSAL', status: 'DRAFT' };
      prisma.order.findFirst.mockResolvedValue(proposalOrder);
      const updated = { ...proposalOrder, status: 'CONFIRMED', customer: { id: 'cust-1' } };
      prisma.order.update.mockResolvedValue(updated);

      await service.updateOrderStatus(orgId, 'order-1', 'CONFIRMED', userId);

      // Only 1 update call (status only, no type conversion)
      expect(prisma.order.update).toHaveBeenCalledTimes(1);
      const quoteConvertedCalls = eventBus.emit.mock.calls.filter(
        (c: any[]) => c[0].type === EventTypes.QUOTE_CONVERTED,
      );
      expect(quoteConvertedCalls).toHaveLength(0);
    });

    it('should emit both ORDER_STATUS_CHANGED and QUOTE_CONVERTED on QUOTE->CONFIRMED', async () => {
      const quoteOrder = { ...baseOrder, number: 'QTN-00001', type: 'QUOTE', status: 'DRAFT' };
      prisma.order.findFirst.mockResolvedValue(quoteOrder);
      prisma.order.update.mockResolvedValueOnce({ ...quoteOrder, status: 'CONFIRMED', customer: { id: 'cust-1' } });
      prisma.order.update.mockResolvedValueOnce({ ...quoteOrder, type: 'SALE', status: 'CONFIRMED', customer: { id: 'cust-1' } });

      await service.updateOrderStatus(orgId, 'order-1', 'CONFIRMED', userId);

      const orderStatusChangedCalls = eventBus.emit.mock.calls.filter(
        (c: any[]) => c[0].type === EventTypes.ORDER_STATUS_CHANGED,
      );
      const quoteConvertedCalls = eventBus.emit.mock.calls.filter(
        (c: any[]) => c[0].type === EventTypes.QUOTE_CONVERTED,
      );
      expect(orderStatusChangedCalls).toHaveLength(1);
      expect(quoteConvertedCalls).toHaveLength(1);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus(orgId, 'nonexistent', 'CONFIRMED', userId),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalled();
    });

    it('should handle transition from DRAFT to CANCELLED', async () => {
      prisma.order.findFirst.mockResolvedValue(baseOrder);
      const updated = { ...baseOrder, status: 'CANCELLED', customer: { id: 'cust-1' } };
      prisma.order.update.mockResolvedValue(updated);

      await service.updateOrderStatus(orgId, 'order-1', 'CANCELLED', userId);

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'CANCELLED' },
        include: { customer: true },
      });
      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ newStatus: 'CANCELLED', previousStatus: 'DRAFT' }),
        }),
      );
    });
  });

  // ── deleteOrder ────────────────────────────────────────────────────

  describe('deleteOrder', () => {
    it('should verify order exists, delete it, and return message', async () => {
      const order = { id: 'order-1', organizationId: orgId, number: 'PED-00001' };
      prisma.order.findFirst.mockResolvedValue(order);
      prisma.order.delete.mockResolvedValue(order);

      const result = await service.deleteOrder(orgId, 'order-1');

      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: 'order-1', organizationId: orgId },
      });
      expect(prisma.order.delete).toHaveBeenCalledWith({ where: { id: 'order-1' } });
      expect(result).toEqual({ message: 'Pedido removido', number: 'PED-00001' });
    });

    it('should throw NotFoundException when order does not exist', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.deleteOrder(orgId, 'nonexistent')).rejects.toThrow(NotFoundException);
      expect(prisma.order.delete).not.toHaveBeenCalled();
    });
  });

  // ── getOrdersByCustomer ────────────────────────────────────────────

  describe('getOrdersByCustomer', () => {
    it('should return orders for the given customer, ordered by createdAt desc', async () => {
      const orders = [
        { id: 'order-2', customerId: 'cust-1', customer: { id: 'cust-1', name: 'Cliente', email: 'c@t.com' } },
        { id: 'order-1', customerId: 'cust-1', customer: { id: 'cust-1', name: 'Cliente', email: 'c@t.com' } },
      ];
      prisma.order.findMany.mockResolvedValue(orders);

      const result = await service.getOrdersByCustomer(orgId, 'cust-1');

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId, customerId: 'cust-1' },
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { id: true, name: true, email: true } } },
      });
      expect(result).toEqual(orders);
    });

    it('should return empty array when customer has no orders', async () => {
      prisma.order.findMany.mockResolvedValue([]);

      const result = await service.getOrdersByCustomer(orgId, 'cust-nonexistent');

      expect(result).toEqual([]);
    });
  });

  // ── getSalesSummary ────────────────────────────────────────────────

  describe('getSalesSummary', () => {
    it('should calculate totalSold, averageTicket, ordersByStatus, and ordersByType', async () => {
      const salesOrders = [
        { total: 100, status: 'CONFIRMED' },
        { total: 200, status: 'DELIVERED' },
        { total: 150, status: 'SHIPPED' },
      ];
      const statusGroups = [
        { status: 'DRAFT', _count: { status: 3 } },
        { status: 'CONFIRMED', _count: { status: 1 } },
        { status: 'DELIVERED', _count: { status: 1 } },
        { status: 'SHIPPED', _count: { status: 1 } },
        { status: 'CANCELLED', _count: { status: 2 } },
      ];
      const typeGroups = [
        { type: 'SALE', _count: { type: 5 } },
        { type: 'QUOTE', _count: { type: 3 } },
      ];

      prisma.order.findMany.mockResolvedValue(salesOrders);
      prisma.order.groupBy
        .mockResolvedValueOnce(statusGroups)
        .mockResolvedValueOnce(typeGroups);

      const result = await service.getSalesSummary(orgId);

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          type: 'SALE',
          status: { notIn: ['DRAFT', 'CANCELLED', 'REFUNDED'] },
        },
        select: { total: true, status: true },
      });

      expect(result.totalSold).toBe(450); // 100 + 200 + 150
      expect(result.totalOrders).toBe(3);
      expect(result.averageTicket).toBe(150); // 450 / 3
      expect(result.ordersByStatus).toEqual({
        DRAFT: 3,
        CONFIRMED: 1,
        DELIVERED: 1,
        SHIPPED: 1,
        CANCELLED: 2,
      });
      expect(result.ordersByType).toEqual({
        SALE: 5,
        QUOTE: 3,
      });
    });

    it('should return zero values when no sales orders exist', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getSalesSummary(orgId);

      expect(result.totalSold).toBe(0);
      expect(result.totalOrders).toBe(0);
      expect(result.averageTicket).toBe(0);
      expect(result.ordersByStatus).toEqual({});
      expect(result.ordersByType).toEqual({});
    });

    it('should round averageTicket to 2 decimal places', async () => {
      const salesOrders = [
        { total: 100, status: 'CONFIRMED' },
        { total: 99.99, status: 'CONFIRMED' },
      ];
      prisma.order.findMany.mockResolvedValue(salesOrders);
      prisma.order.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getSalesSummary(orgId);

      expect(result.averageTicket).toBe(100); // (100 + 99.99) / 2 = 99.995 -> 100
    });

    it('should exclude DRAFT, CANCELLED, and REFUNDED from sales summary', async () => {
      const salesOrders = [
        { total: 300, status: 'DELIVERED' },
      ];
      prisma.order.findMany.mockResolvedValue(salesOrders);
      prisma.order.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.getSalesSummary(orgId);

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          type: 'SALE',
          status: { notIn: ['DRAFT', 'CANCELLED', 'REFUNDED'] },
        },
        select: { total: true, status: true },
      });
    });

    it('should group by status and type separately', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.groupBy
        .mockResolvedValueOnce([{ status: 'DRAFT', _count: { status: 2 } }])
        .mockResolvedValueOnce([{ type: 'SALE', _count: { type: 2 } }]);

      const result = await service.getSalesSummary(orgId);

      expect(prisma.order.groupBy).toHaveBeenNthCalledWith(1, {
        by: ['status'],
        where: { organizationId: orgId },
        _count: { status: true },
      });
      expect(prisma.order.groupBy).toHaveBeenNthCalledWith(2, {
        by: ['type'],
        where: { organizationId: orgId },
        _count: { type: true },
      });
      expect(result.ordersByStatus).toEqual({ DRAFT: 2 });
      expect(result.ordersByType).toEqual({ SALE: 2 });
    });
  });
});
