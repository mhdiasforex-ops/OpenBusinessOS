import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private prisma: PrismaService) {}

  async getMetrics(orgId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      incomeThisMonth,
      expenseThisMonth,
      activeCustomers,
      totalProducts,
      overdueCount,
      totalTransactions,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { organizationId: orgId, type: 'INCOME', status: 'PAID', paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { organizationId: orgId, type: 'EXPENSE', status: 'PAID', paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.customer.count({ where: { organizationId: orgId, segment: { in: ['VIP', 'REGULAR', 'NEW'] } } }),
      this.prisma.product.count({ where: { organizationId: orgId, isActive: true } }),
      this.prisma.transaction.count({ where: { organizationId: orgId, status: 'OVERDUE' } }),
      this.prisma.transaction.count({ where: { organizationId: orgId } }),
    ]);

    const income = Number(incomeThisMonth._sum.amount || 0);
    const expense = Number(expenseThisMonth._sum.amount || 0);
    const profit = income - expense;
    const averageMargin = income > 0 ? (profit / income) * 100 : 0;

    return {
      income,
      expense,
      profit,
      activeCustomers,
      totalProducts,
      totalTransactions,
      averageMargin: Math.round(averageMargin * 100) / 100,
      overdueCount,
    };
  }

  async getRevenueTimeSeries(orgId: string, months: number = 12) {
    const now = new Date();
    const series = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = start.toISOString().substring(0, 7);

      const [income, expense] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: { organizationId: orgId, type: 'INCOME', status: 'PAID', paidAt: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { organizationId: orgId, type: 'EXPENSE', status: 'PAID', paidAt: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ]);

      series.push({
        date: label,
        income: Number(income._sum.amount || 0),
        expense: Number(expense._sum.amount || 0),
        profit: Number(income._sum.amount || 0) - Number(expense._sum.amount || 0),
      });
    }

    return series;
  }

  async getCategoryBreakdown(orgId: string, type: 'INCOME' | 'EXPENSE', months: number = 3) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await this.prisma.transaction.findMany({
      where: { organizationId: orgId, type, status: 'PAID', paidAt: { gte: startDate } },
      select: { category: true, amount: true },
    });

    const categoryMap = new Map<string, number>();
    let total = 0;

    transactions.forEach((t) => {
      const amount = Number(t.amount);
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + amount);
      total += amount;
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }
}
