'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  ShoppingCart,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

export interface StatCardData {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const mockStats: StatCardData[] = [
  {
    title: 'Receita Total',
    value: 'R$ 127.450,00',
    change: 12.5,
    icon: DollarSign,
  },
  {
    title: 'Pedidos Mês',
    value: '84',
    change: 8.2,
    icon: ShoppingCart,
  },
  {
    title: 'Clientes Ativos',
    value: '1.243',
    change: -2.1,
    icon: Users,
  },
  {
    title: 'NFS-e Emitidas',
    value: '67',
    change: 15.3,
    icon: FileText,
  },
];

// ── Component ──────────────────────────────────────────────────────────────

function StatCard({ title, value, change, icon: Icon }: StatCardData) {
  const isPositive = change >= 0;

  return (
    <Card className="transition-shadow hover:shadow-md dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-md bg-primary/10 p-2 dark:bg-primary/20">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          {isPositive ? (
            <ArrowUpRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-red-600 dark:text-red-400" />
          )}
          <span
            className={
              isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }
          >
            {isPositive ? '+' : ''}
            {change}%
          </span>{' '}
          em relação ao mês anterior
        </p>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ stats = mockStats }: { stats?: StatCardData[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
