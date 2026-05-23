'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DollarSign,
  Users,
  Package,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Types ──────────────────────────────────────────────────────────────────

interface Metrics {
  income: number;
  expense: number;
  profit: number;
  activeCustomers: number;
  totalProducts: number;
  totalTransactions: number;
  averageMargin: number;
  overdueCount: number;
}

interface ApiTransaction {
  id: string;
  description: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: string;
  dueDate: string;
  paidAt: string | null;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paymentMethod: string;
  customer?: { name: string; email: string } | null;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled' | 'overdue';
}

interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd MMM yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function statusVariant(
  status: string,
): 'success' | 'warning' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
    case 'PAID':
      return 'success';
    case 'pending':
    case 'PENDING':
      return 'warning';
    case 'overdue':
    case 'OVERDUE':
      return 'destructive';
    case 'cancelled':
    case 'CANCELLED':
      return 'outline';
    default:
      return 'outline';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'completed':
    case 'PAID':
      return 'Concluída';
    case 'pending':
    case 'PENDING':
      return 'Pendente';
    case 'overdue':
    case 'OVERDUE':
      return 'Vencida';
    case 'cancelled':
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status;
  }
}

function mapApiTransaction(tx: ApiTransaction): Transaction {
  return {
    id: tx.id,
    description: tx.description,
    amount: Number(tx.amount),
    type: tx.type === 'INCOME' ? 'income' : 'expense',
    category: tx.category,
    date: tx.paidAt || tx.dueDate,
    status: tx.status === 'PAID' ? 'completed' : tx.status === 'PENDING' ? 'pending' : tx.status === 'OVERDUE' ? 'overdue' : 'cancelled',
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  change,
  icon: Icon,
  loading,
  isCurrency,
}: {
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
  loading: boolean;
  isCurrency?: boolean;
}) {
  const isPositive = change >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-10 items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {isCurrency ? formatCurrency(value) : value}
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
                {isPositive ? '+' : ''}
                {change}%
              </span>{' '}
              em relação ao mês anterior
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RevenueChart({ data, loading }: { data: RevenueData[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Nenhum dado de receita disponível
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex h-64 items-end gap-2 pt-4">
      {data.map((item, index) => {
        const revenueHeight = (item.revenue / maxRevenue) * 100;
        const expenseHeight = (item.expenses / maxRevenue) * 100;

        return (
          <div key={index} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end gap-0.5" style={{ height: '200px' }}>
              <div
                className="flex-1 rounded-t-md bg-primary/80 transition-all hover:bg-primary"
                style={{ height: `${revenueHeight}%` }}
                title={`Receita: ${formatCurrency(item.revenue)}`}
              />
              <div
                className="flex-1 rounded-t-md bg-destructive/60 transition-all hover:bg-destructive/80"
                style={{ height: `${expenseHeight}%` }}
                title={`Despesas: ${formatCurrency(item.expenses)}`}
              />
            </div>
            <span className="text-xs text-muted-foreground">{item.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function TransactionsTable({
  transactions,
  loading,
}: {
  transactions: Transaction[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Nenhuma transação encontrada
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell className="font-medium">{tx.description}</TableCell>
            <TableCell>{tx.category}</TableCell>
            <TableCell>{formatDate(tx.date)}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(tx.status)}>
                {statusLabel(tx.status)}
              </Badge>
            </TableCell>
            <TableCell
              className={`text-right font-medium ${
                tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {tx.type === 'income' ? '+' : '-'}
              {formatCurrency(Math.abs(tx.amount))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const r = await api.get('/analytics/metrics');
      return r as Metrics;
    },
  });

  const { data: transactionsRaw, isLoading: transactionsLoading } = useQuery({
    queryKey: ['dashboard-transactions'],
    queryFn: () => api.get('/financial/transactions?limit=10'),
  });

  // API returns { data: [...], total, page, perPage } — extract array
  const transactions: Transaction[] = (() => {
    const raw = transactionsRaw as any;
    if (Array.isArray(raw)) return raw.map(mapApiTransaction);
    if (raw?.data && Array.isArray(raw.data)) return raw.data.map(mapApiTransaction);
    return [];
  })();

  const { data: revenueSeries, isLoading: revenueLoading } = useQuery({
    queryKey: ['dashboard-revenue'],
    queryFn: () => api.get('/analytics/revenue-time-series?months=6'),
  });

  // Map revenue time series to chart format
  const revenueData: RevenueData[] = (() => {
    const raw = revenueSeries as any[];
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => ({
      month: item.date?.substring(0, 7) || item.month || '',
      revenue: Number(item.income || 0),
      expenses: Number(item.expense || 0),
    }));
  })();

  const kpiCards = [
    {
      title: 'Receita Mensal',
      value: metrics?.income ?? 0,
      change: 0,
      icon: DollarSign,
      isCurrency: true,
    },
    {
      title: 'Clientes Ativos',
      value: metrics?.activeCustomers ?? 0,
      change: 0,
      icon: Users,
    },
    {
      title: 'Produtos',
      value: metrics?.totalProducts ?? 0,
      change: 0,
      icon: Package,
    },
    {
      title: 'Margem Média',
      value: metrics?.averageMargin ?? 0,
      change: 0,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <KPICard
            key={card.title}
            title={card.title}
            value={card.value}
            change={card.change}
            icon={card.icon}
            loading={metricsLoading}
            isCurrency={card.isCurrency}
          />
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="visao-geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Revenue Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle className="text-base">
                  Receita vs Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-primary/80" />
                    <span className="text-muted-foreground">Receita</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-destructive/60" />
                    <span className="text-muted-foreground">Despesas</span>
                  </div>
                </div>
                <RevenueChart data={revenueData} loading={revenueLoading} />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start gap-2" asChild>
                  <a href="/financial">
                    <Plus className="h-4 w-4" />
                    Nova Transação
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  asChild
                >
                  <a href="/products/novo">
                    <Plus className="h-4 w-4" />
                    Novo Produto
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  asChild
                >
                  <a href="/crm">
                    <Plus className="h-4 w-4" />
                    Novo Cliente
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions (compact) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Transações Recentes
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <a href="/financial">Ver todas</a>
              </Button>
            </CardHeader>
            <CardContent>
              <TransactionsTable
                transactions={transactions}
                loading={transactionsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transacoes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Últimas Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionsTable
                transactions={transactions}
                loading={transactionsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
