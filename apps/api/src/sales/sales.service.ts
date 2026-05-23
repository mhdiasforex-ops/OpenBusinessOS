import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { EventTypes } from '@openbusinessos/event-definitions';
import { OrderType, OrderStatus } from '@prisma/client';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderListQueryDto,
  UpdateOrderStatusDto,
} from './sales.dto';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  // --- Gerar número sequencial do pedido ---

  private async generateOrderNumber(orgId: string, type: string): Promise<string> {
    const prefix = type === 'SALE' ? 'PED' : type === 'QUOTE' ? 'QTN' : 'PRP';

    const lastOrder = await this.prisma.order.findFirst({
      where: { organizationId: orgId, number: { startsWith: `${prefix}-` } },
      orderBy: { createdAt: 'desc' },
      select: { number: true },
    });

    let nextSeq = 1;
    if (lastOrder?.number) {
      const parts = lastOrder.number.split('-');
      const lastSeq = parseInt(parts[1], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    return `${prefix}-${String(nextSeq).padStart(5, '0')}`;
  }

  // --- Criar pedido ---

  async createOrder(orgId: string, dto: CreateOrderDto, userId: string) {
    const number = await this.generateOrderNumber(orgId, dto.type);

    const discount = dto.discount ?? 0;
    const total = dto.subtotal - discount;

    const order = await this.prisma.order.create({
      data: {
        organizationId: orgId,
        customerId: dto.customerId,
        number,
        type: dto.type as OrderType,
        status: 'DRAFT',
        items: dto.items as any,
        subtotal: dto.subtotal,
        discount,
        total,
        notes: dto.notes,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: { customer: true },
    });

    await this.eventBus.emit({
      organizationId: orgId,
      type: EventTypes.ORDER_CREATED,
      source: 'sales-service',
      payload: {
        orderId: order.id,
        number: order.number,
        type: order.type,
        customerId: order.customerId,
        total: Number(order.total),
        userId,
      },
    });

    this.logger.log(`Pedido ${number} criado para org ${orgId}`);

    return order;
  }

  // --- Listar pedidos com paginação e filtros ---

  async getOrders(orgId: string, query: OrderListQueryDto) {
    const page = query.page || 1;
    const perPage = query.perPage || 25;

    const where: any = { organizationId: orgId };
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.customerId) where.customerId = query.customerId;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: { customer: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  // --- Buscar pedido por ID ---

  async getOrder(orgId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, organizationId: orgId },
      include: { customer: true, organization: { select: { id: true, name: true } } },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  // --- Atualizar pedido ---

  async updateOrder(orgId: string, id: string, dto: UpdateOrderDto) {
    const existing = await this.prisma.order.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Pedido não encontrado');

    const subtotal = dto.subtotal !== undefined ? dto.subtotal : Number(existing.subtotal);
    const discount = dto.discount !== undefined ? dto.discount : Number(existing.discount);
    const total = subtotal - discount;

    const order = await this.prisma.order.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        type: dto.type ? (dto.type as OrderType) : undefined,
        items: dto.items ? (dto.items as any) : undefined,
        subtotal: dto.subtotal,
        discount: dto.discount,
        total,
        notes: dto.notes,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: { customer: true },
    });

    await this.eventBus.emit({
      organizationId: orgId,
      type: EventTypes.ORDER_UPDATED,
      source: 'sales-service',
      payload: {
        orderId: order.id,
        number: order.number,
        type: order.type,
        updatedFields: Object.keys(dto),
      },
    });

    return order;
  }

  // --- Atualizar status do pedido ---

  async updateOrderStatus(orgId: string, id: string, status: string, userId: string) {
    const existing = await this.prisma.order.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Pedido não encontrado');

    const previousStatus = existing.status;
    const newStatus = status as OrderStatus;

    const updateData: any = { status: newStatus };

    // Se entregue, registrar data
    if (newStatus === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const order = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: { customer: true },
    });

    await this.eventBus.emit({
      organizationId: orgId,
      type: EventTypes.ORDER_STATUS_CHANGED,
      source: 'sales-service',
      payload: {
        orderId: order.id,
        number: order.number,
        previousStatus,
        newStatus,
        userId,
      },
    });

  // Se converteu de QUOTE para SALE, emitir QUOTE_CONVERTED
  if (existing.type === 'QUOTE' && newStatus === 'CONFIRMED') {
      // Converter o tipo também para SALE
      const converted = await this.prisma.order.update({
        where: { id },
        data: { type: 'SALE' },
        include: { customer: true },
      });

      await this.eventBus.emit({
        organizationId: orgId,
        type: EventTypes.QUOTE_CONVERTED,
        source: 'sales-service',
        payload: {
          orderId: converted.id,
          number: converted.number,
          customerId: converted.customerId,
          total: Number(converted.total),
          userId,
        },
      });

      this.logger.log(`QTN ${converted.number} convertida para PED`);
      return converted;
    }

    this.logger.log(`Pedido ${order.number} status: ${previousStatus} → ${newStatus}`);

    return order;
  }

  // --- Remover pedido ---

  async deleteOrder(orgId: string, id: string) {
    const order = await this.prisma.order.findFirst({ where: { id, organizationId: orgId } });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    await this.prisma.order.delete({ where: { id } });
    this.logger.log(`Pedido ${order.number} removido`);
    return { message: 'Pedido removido', number: order.number };
  }

  // --- Listar pedidos de um cliente ---

  async getOrdersByCustomer(orgId: string, customerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { organizationId: orgId, customerId },
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true, email: true } } },
    });

    return orders;
  }

  // --- Resumo de vendas ---

  async getSalesSummary(orgId: string) {
    // Total vendido (pedidos do tipo SALE com status >= CONFIRMED)
    const salesOrders = await this.prisma.order.findMany({
      where: {
        organizationId: orgId,
        type: 'SALE',
        status: { notIn: ['DRAFT', 'CANCELLED', 'REFUNDED'] },
      },
      select: { total: true, status: true },
    });

    const totalSold = salesOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = salesOrders.length;
    const averageTicket = totalOrders > 0 ? totalSold / totalOrders : 0;

    // Pedidos por status
    const statusGroups = await this.prisma.order.groupBy({
      by: ['status'],
      where: { organizationId: orgId },
      _count: { status: true },
    });

    const ordersByStatus: Record<string, number> = {};
    for (const group of statusGroups) {
      ordersByStatus[group.status] = group._count.status;
    }

    // Pedidos por tipo
    const typeGroups = await this.prisma.order.groupBy({
      by: ['type'],
      where: { organizationId: orgId },
      _count: { type: true },
    });

    const ordersByType: Record<string, number> = {};
    for (const group of typeGroups) {
      ordersByType[group.type] = group._count.type;
    }

    return {
      totalSold,
      totalOrders,
      averageTicket: Math.round(averageTicket * 100) / 100,
      ordersByStatus,
      ordersByType,
    };
  }
}
