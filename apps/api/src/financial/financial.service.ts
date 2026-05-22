import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { EventTypes } from '@openbusinessos/event-definitions';
import { Prisma, TransactionStatus, TransactionType, PaymentMethod as PrismaPaymentMethod } from '@prisma/client';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  CashFlowQueryDto,
  ConciliateDto,
} from './financial.dto';
import { CashFlowService } from './cash-flow.service';
import { ConciliationService } from './conciliation.service';
import { OverdueDetector } from './overdue-detector';
import { DreService } from './dre.service';
import { CmvService } from './cmv.service';

@Injectable()
export class FinancialService {
  private readonly logger = new Logger(FinancialService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private cashFlowService: CashFlowService,
    private conciliationService: ConciliationService,
    private overdueDetector: OverdueDetector,
    private dreService: DreService,
    private cmvService: CmvService,
  ) {}

  // --- Transactions CRUD ---

  async createTransaction(orgId: string, dto: CreateTransactionDto, userId: string) {
    const transaction = await this.prisma.transaction.create({
      data: {
        organizationId: orgId,
        type: dto.type as TransactionType,
        category: dto.category,
        amount: new Prisma.Decimal(dto.amount),
        description: dto.description,
        customerId: dto.customerId,
        dueDate: new Date(dto.dueDate),
        paymentMethod: dto.paymentMethod as PrismaPaymentMethod,
        status: (dto.status || 'PENDING') as TransactionStatus,
        auditTrail: { createdBy: userId, createdAt: new Date().toISOString() },
      },
      include: { items: true },
    });

    // Create items if provided
    if (dto.items?.length) {
      for (const item of dto.items) {
        await this.prisma.transactionItem.create({
          data: {
            organizationId: orgId,
            transactionId: transaction.id,
            productId: item.productId,
            quantity: new Prisma.Decimal(item.quantity),
            unitPrice: new Prisma.Decimal(item.unitPrice),
            total: new Prisma.Decimal(item.total),
          },
        });
      }
    }

    // Emit event
    await this.eventBus.emit({
      organizationId: orgId,
      type: EventTypes.TRANSACTION_CREATED,
      source: 'financial-service',
      payload: {
        transactionId: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        category: transaction.category,
        dueDate: transaction.dueDate.toISOString(),
      },
    });

    this.logger.log(`Transaction created: ${transaction.id} for org ${orgId}`);
    return transaction;
  }

  async getTransactions(orgId: string, filters: { type?: string; status?: string; category?: string; page?: number; perPage?: number }) {
    const page = filters.page || 1;
    const perPage = filters.perPage || 25;

    const where: any = { organizationId: orgId };
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { customer: { select: { id: true, name: true } }, items: true },
        orderBy: { dueDate: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  async getTransaction(orgId: string, id: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: { id, organizationId: orgId },
      include: { customer: true, items: { include: { product: true } } },
    });
    if (!tx) throw new NotFoundException('Transação não encontrada');
    return tx;
  }

  async updateTransaction(orgId: string, id: string, dto: UpdateTransactionDto, userId: string) {
    const existing = await this.prisma.transaction.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) throw new NotFoundException('Transação não encontrada');

    return this.prisma.transaction.update({
      where: { id },
      data: {
        category: dto.category,
        amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
        status: dto.status ? (dto.status as TransactionStatus) : undefined,
        paymentMethod: dto.paymentMethod ? (dto.paymentMethod as PrismaPaymentMethod) : undefined,
        auditTrail: {
          ...(existing.auditTrail as object || {}),
          updatedBy: userId,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }

  async markAsPaid(orgId: string, id: string, paymentMethod: string, userId: string) {
    const tx = await this.prisma.transaction.findFirst({ where: { id, organizationId: orgId } });
    if (!tx) throw new NotFoundException('Transação não encontrada');

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        status: TransactionStatus.PAID,
        paidAt: new Date(),
        paymentMethod: paymentMethod as PrismaPaymentMethod,
        auditTrail: {
          ...(tx.auditTrail as object || {}),
          paidBy: userId,
          paidAt: new Date().toISOString(),
          paymentMethod,
        },
      },
    });

    await this.eventBus.emit({
      organizationId: orgId,
      type: EventTypes.TRANSACTION_PAID,
      source: 'financial-service',
      payload: {
        transactionId: id,
        amount: Number(updated.amount),
        paymentMethod,
        paidAt: updated.paidAt!.toISOString(),
      },
    });

    return updated;
  }

  async deleteTransaction(orgId: string, id: string) {
    const tx = await this.prisma.transaction.findFirst({ where: { id, organizationId: orgId } });
    if (!tx) throw new NotFoundException('Transação não encontrada');

    await this.prisma.transactionItem.deleteMany({ where: { transactionId: id } });
    await this.prisma.transaction.delete({ where: { id } });
    return { message: 'Transação removida' };
  }

  // --- Delegação para sub-serviços ---

  /** Cash Flow — delega para CashFlowService */
  async getCashFlow(orgId: string, query: CashFlowQueryDto) {
    return this.cashFlowService.getCashFlow(orgId, query);
  }

  /** Cash Flow por meses — delega para CashFlowService */
  async getCashFlowByMonths(orgId: string, months: number = 3) {
    return this.cashFlowService.getCashFlowByMonths(orgId, months);
  }

  /** DRE — delega para DreService */
  async getDRE(orgId: string, month: number, year: number) {
    return this.dreService.generateDRE(orgId, month, year);
  }

  /** DRE Comparativo — delega para DreService */
  async getDREComparison(orgId: string, months: number = 3) {
    return this.dreService.getDREComparison(orgId, months);
  }

  /** CMV — delega para CmvService */
  async getCMV(orgId: string, month: number, year: number) {
    return this.cmvService.calculateCMV(orgId, month, year);
  }

  /** Conciliação — delega para ConciliationService */
  async conciliate(orgId: string, dto: ConciliateDto, userId: string) {
    return this.conciliationService.conciliate(orgId, dto, userId);
  }

  /** Detecção de atrasos — delega para OverdueDetector */
  async checkOverdue(orgId: string) {
    return this.overdueDetector.detect(orgId);
  }
}
