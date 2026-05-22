import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DREResult {
  period: string;
  grossRevenue: number;
  cogs: number;
  netRevenue: number;
  grossMargin: number;
  operatingExpenses: { name: string; value: number; percentage: number }[];
  operatingTotal: number;
  ebitda: number;
  netIncome: number;
  netMargin: number;
}

@Injectable()
export class DreService {
  private readonly logger = new Logger(DreService.name);

  constructor(private prisma: PrismaService) {}

  async generateDRE(orgId: string, month: number, year: number): Promise<DREResult> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        dueDate: { gte: startDate, lte: endDate },
        status: 'PAID',
      },
    });

    const income = transactions.filter((t) => t.type === 'INCOME');
    const expenses = transactions.filter((t) => t.type === 'EXPENSE');

    const grossRevenue = income.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    // Group expenses by category
    const expenseByCategory = new Map<string, number>();
    expenses.forEach((t) => {
      const current = expenseByCategory.get(t.category) || 0;
      expenseByCategory.set(t.category, current + Number(t.amount));
    });

    // Estimate COGS (cost of goods sold) from "Custo" or "CMV" category
    const cogs = expenseByCategory.get('Custo') || expenseByCategory.get('CMV') || 0;
    const netRevenue = grossRevenue - cogs;
    const grossMargin = grossRevenue > 0 ? ((grossRevenue - cogs) / grossRevenue) * 100 : 0;
    const operatingExpenses = Array.from(expenseByCategory.entries())
      .filter(([cat]) => cat !== 'Custo' && cat !== 'CMV')
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
      }));
    const operatingTotal = operatingExpenses.reduce((sum, e) => sum + e.value, 0);
    const ebitda = netRevenue - operatingTotal;
    const netIncome = grossRevenue - totalExpenses;

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      grossRevenue,
      cogs,
      netRevenue,
      grossMargin,
      operatingExpenses,
      operatingTotal,
      ebitda,
      netIncome,
      netMargin: grossRevenue > 0 ? (netIncome / grossRevenue) * 100 : 0,
    };
  }

  async getDREComparison(orgId: string, months: number = 3): Promise<DREResult[]> {
    const results: DREResult[] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dre = await this.generateDRE(orgId, d.getMonth() + 1, d.getFullYear());
      results.push(dre);
    }

    return results.reverse();
  }
}
