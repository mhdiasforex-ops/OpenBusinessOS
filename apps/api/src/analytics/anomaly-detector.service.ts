import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { EventTypes, AnomalyDetectedPayload } from '@openbusinessos/event-definitions';

export interface AnomalyResult {
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  data: Record<string, any>;
}

@Injectable()
export class AnomalyDetectorService {
  private readonly logger = new Logger(AnomalyDetectorService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  /**
   * Executa todas as verificações de anomalia para uma organização.
   * Retorna a lista de anomalias detectadas e emite evento para cada uma.
   */
  async detectAnomalies(orgId: string): Promise<AnomalyResult[]> {
    const anomalies: AnomalyResult[] = [];

    const [expenseAnomaly, revenueAnomaly, stockAnomaly, vipAnomaly] = await Promise.all([
      this.detectExpenseAnomaly(orgId),
      this.detectRevenueDropAnomaly(orgId),
      this.detectZeroStockAnomaly(orgId),
      this.detectVipWithoutOrderAnomaly(orgId),
    ]);

    if (expenseAnomaly) anomalies.push(expenseAnomaly);
    if (revenueAnomaly) anomalies.push(revenueAnomaly);
    if (stockAnomaly) anomalies.push(stockAnomaly);
    if (vipAnomaly) anomalies.push(vipAnomaly);

    // Emitir evento ANOMALY_DETECTED para cada anomalia encontrada
    for (const anomaly of anomalies) {
      await this.emitAnomalyEvent(orgId, anomaly);
    }

    this.logger.log(`Detected ${anomalies.length} anomaly(ies) for org ${orgId}`);
    return anomalies;
  }

  /**
   * Detecta despesa do mês atual > 150% da média dos últimos 3 meses.
   */
  private async detectExpenseAnomaly(orgId: string): Promise<AnomalyResult | null> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Despesa do mês atual
    const currentExpense = await this.prisma.transaction.aggregate({
      where: {
        organizationId: orgId,
        type: 'EXPENSE',
        status: 'PAID',
        paidAt: { gte: currentMonthStart },
      },
      _sum: { amount: true },
    });

    const currentAmount = Number(currentExpense._sum.amount || 0);

    // Média dos últimos 3 meses
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const pastExpenses = await this.prisma.transaction.aggregate({
      where: {
        organizationId: orgId,
        type: 'EXPENSE',
        status: 'PAID',
        paidAt: { gte: threeMonthsAgo, lt: currentMonthStart },
      },
      _sum: { amount: true },
    });

    const pastTotal = Number(pastExpenses._sum.amount || 0);
    const pastAverage = pastTotal / 3;

    if (pastAverage > 0 && currentAmount > pastAverage * 1.5) {
      const ratio = currentAmount / pastAverage;
      return {
        type: 'EXPENSE_ABOVE_THRESHOLD',
        description: `Despesa do mês atual (${currentAmount.toFixed(2)}) é ${(ratio * 100).toFixed(0)}% da média dos últimos 3 meses (${pastAverage.toFixed(2)}), ultrapassando 150%.`,
        severity: ratio > 2 ? 'CRITICAL' : ratio > 1.75 ? 'HIGH' : 'MEDIUM',
        data: {
          currentExpense: currentAmount,
          averageExpense: pastAverage,
          ratio: Math.round(ratio * 100) / 100,
          threshold: 1.5,
          period: currentMonthStart.toISOString().substring(0, 7),
        },
      };
    }

    return null;
  }

  /**
   * Detecta receita caindo > 30% mês a mês (comparando mês atual parcial
   * com o mês anterior completo, ou mês anterior vs 2 meses atrás).
   */
  private async detectRevenueDropAnomaly(orgId: string): Promise<AnomalyResult | null> {
    const now = new Date();

    // Receita do mês anterior (completo)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Receita de 2 meses atrás (completo)
    const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const twoMonthsAgoEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);

    const [lastMonthRevenue, twoMonthsAgoRevenue] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          organizationId: orgId,
          type: 'INCOME',
          status: 'PAID',
          paidAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          organizationId: orgId,
          type: 'INCOME',
          status: 'PAID',
          paidAt: { gte: twoMonthsAgoStart, lte: twoMonthsAgoEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    const lastMonth = Number(lastMonthRevenue._sum.amount || 0);
    const twoMonthsAgo = Number(twoMonthsAgoRevenue._sum.amount || 0);

    if (twoMonthsAgo > 0) {
      const dropPercent = ((twoMonthsAgo - lastMonth) / twoMonthsAgo) * 100;

      if (dropPercent > 30) {
        return {
          type: 'REVENUE_DROP',
          description: `Receita caiu ${dropPercent.toFixed(1)}% de ${twoMonthsAgo.toFixed(2)} para ${lastMonth.toFixed(2)} mês a mês, ultrapassando o limite de 30%.`,
          severity: dropPercent > 50 ? 'CRITICAL' : dropPercent > 40 ? 'HIGH' : 'MEDIUM',
          data: {
            previousRevenue: twoMonthsAgo,
            currentRevenue: lastMonth,
            dropPercent: Math.round(dropPercent * 100) / 100,
            threshold: 30,
            period: lastMonthStart.toISOString().substring(0, 7),
          },
        };
      }
    }

    return null;
  }

  /**
   * Detecta produtos ativos com estoque zerado.
   */
  private async detectZeroStockAnomaly(orgId: string): Promise<AnomalyResult | null> {
    const zeroStockProducts = await this.prisma.product.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
        stockQuantity: 0,
      },
      select: { id: true, name: true, sku: true },
    });

    if (zeroStockProducts.length > 0) {
      return {
        type: 'ZERO_STOCK_ACTIVE_PRODUCTS',
        description: `${zeroStockProducts.length} produto(s) ativo(s) com estoque zerado: ${zeroStockProducts.map((p) => p.name).join(', ')}.`,
        severity: zeroStockProducts.length > 5 ? 'HIGH' : zeroStockProducts.length > 2 ? 'MEDIUM' : 'LOW',
        data: {
          count: zeroStockProducts.length,
          products: zeroStockProducts.map((p) => ({ id: p.id, name: p.name, sku: p.sku })),
        },
      };
    }

    return null;
  }

  /**
   * Detecta clientes VIP sem pedido há mais de 60 dias.
   */
  private async detectVipWithoutOrderAnomaly(orgId: string): Promise<AnomalyResult | null> {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Buscar clientes VIP da organização
    const vipCustomers = await this.prisma.customer.findMany({
      where: {
        organizationId: orgId,
        segment: 'VIP',
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastOrderAt: true,
      },
    });

    // Filtrar os que não têm pedido há > 60 dias
    const inactiveVips = vipCustomers.filter((c) => {
      if (!c.lastOrderAt) return true;
      return new Date(c.lastOrderAt) < sixtyDaysAgo;
    });

    if (inactiveVips.length > 0) {
      return {
        type: 'VIP_WITHOUT_ORDER',
        description: `${inactiveVips.length} cliente(s) VIP sem pedido há mais de 60 dias: ${inactiveVips.map((c) => c.name).join(', ')}.`,
        severity: inactiveVips.length > 3 ? 'HIGH' : inactiveVips.length > 1 ? 'MEDIUM' : 'LOW',
        data: {
          count: inactiveVips.length,
          thresholdDays: 60,
          customers: inactiveVips.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            lastOrderAt: c.lastOrderAt?.toISOString() || null,
          })),
        },
      };
    }

    return null;
  }

  /**
   * Emite evento ANOMALY_DETECTED via EventBusService.
   */
  private async emitAnomalyEvent(orgId: string, anomaly: AnomalyResult): Promise<void> {
    const payload: AnomalyDetectedPayload = {
      organizationId: orgId,
      type: anomaly.type,
      description: anomaly.description,
      severity: anomaly.severity,
      data: anomaly.data,
    };

    await this.eventBus.emit({
      organizationId: orgId,
      type: EventTypes.ANOMALY_DETECTED,
      source: AnomalyDetectorService.name,
      payload,
    });

    this.logger.debug(`Anomaly event emitted: ${anomaly.type} [${anomaly.severity}] for org ${orgId}`);
  }
}
