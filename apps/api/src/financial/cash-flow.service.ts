import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CashFlowEntry {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
}

export interface CashFlowSummary {
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  finalBalance: number;
}

export interface CashFlowResult {
  period: { startDate: string; endDate: string };
  entries: CashFlowEntry[];
  summary: CashFlowSummary;
}

@Injectable()
export class CashFlowService {
  private readonly logger = new Logger(CashFlowService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Projeção de fluxo de caixa entre duas datas.
   * Se `months` for informado, calcula automaticamente o período
   * a partir de hoje (início = hoje, fim = hoje + N meses).
   */
  async getCashFlow(
    orgId: string,
    query: { startDate: string; endDate: string },
  ): Promise<CashFlowResult> {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        dueDate: { gte: startDate, lte: endDate },
        status: { in: ['PAID', 'PENDING'] },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Agrupar por data
    const dailyMap = new Map<string, { inflow: number; outflow: number }>();

    transactions.forEach((tx) => {
      const dateKey = tx.dueDate.toISOString().split('T')[0];
      const entry = dailyMap.get(dateKey) || { inflow: 0, outflow: 0 };

      if (tx.type === 'INCOME') {
        entry.inflow += Number(tx.amount);
      } else if (tx.type === 'EXPENSE') {
        entry.outflow += Number(tx.amount);
      }

      dailyMap.set(dateKey, entry);
    });

    let balance = 0;
    const cashFlow = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { inflow, outflow }]) => {
        balance += inflow - outflow;
        return { date, inflow, outflow, balance };
      });

    const totalInflow = cashFlow.reduce((sum, e) => sum + e.inflow, 0);
    const totalOutflow = cashFlow.reduce((sum, e) => sum + e.outflow, 0);

    this.logger.log(
      `Cash flow generated for org ${orgId}: ${cashFlow.length} days, net ${totalInflow - totalOutflow}`,
    );

    return {
      period: { startDate: query.startDate, endDate: query.endDate },
      entries: cashFlow,
      summary: {
        totalInflow,
        totalOutflow,
        netFlow: totalInflow - totalOutflow,
        finalBalance: balance,
      },
    };
  }

  /**
   * Projeção de fluxo de caixa baseada em número de meses a partir de hoje.
   */
  async getCashFlowByMonths(orgId: string, months: number = 3): Promise<CashFlowResult> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    return this.getCashFlow(orgId, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  }
}
