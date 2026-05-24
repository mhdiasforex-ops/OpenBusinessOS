'use client';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatCurrency } from '@openbusinessos/utils';
import { Download, TrendingUp, TrendingDown, Users, Package, AlertTriangle, BarChart3, PieChart, Search, Loader2, Star, Shield, ShieldAlert, ShieldX, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface AnalyticsMetrics {
  income: number;
  expense: number;
  profit: number;
  activeCustomers: number;
  totalProducts: number;
  totalTransactions: number;
  averageMargin: number;
  overdueCount: number;
}

interface Anomaly {
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  data: Record<string, any>;
}

interface ProductPerformance {
  id: string;
  name: string;
  sku: string;
  salePrice: string;
  costPrice: string;
  stockQuantity: number;
  minStock: number;
  margin: number;
  isLowStock: boolean;
}

const anomalyTypeLabels: Record<string, string> = {
  EXPENSE_ABOVE_THRESHOLD: 'Despesa Acima do Limite',
  REVENUE_DROP: 'Queda de Receita',
  ZERO_STOCK_ACTIVE_PRODUCTS: 'Estoque Zerado',
  VIP_WITHOUT_ORDER: 'VIP sem Pedido',
};

const severityConfig: Record<string, { icon: React.ElementType; color: string; badge: 'outline' | 'default' | 'destructive' | 'secondary' }> = {
  LOW: { icon: Shield, color: 'text-blue-500', badge: 'outline' },
  MEDIUM: { icon: ShieldAlert, color: 'text-yellow-500', badge: 'secondary' },
  HIGH: { icon: ShieldX, color: 'text-orange-500', badge: 'default' },
  CRITICAL: { icon: ShieldX, color: 'text-red-600', badge: 'destructive' },
};

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [anomalyResults, setAnomalyResults] = useState<Anomaly[] | null>(null);

  const { data: metrics, isLoading: metricsLoading } = useQuery<AnalyticsMetrics>({
    queryKey: ['analytics-metrics'],
    queryFn: async () => { const r = await api.get('/analytics/metrics'); return r as AnalyticsMetrics; },
  });

  const { data: revenueSeries } = useQuery({
    queryKey: ['revenue-time-series'],
    queryFn: () => api.get('/analytics/revenue-time-series'),
  });

  const { data: categoryBreakdown } = useQuery({
    queryKey: ['category-breakdown', 'EXPENSE'],
    queryFn: () => api.get('/analytics/category-breakdown', { type: 'EXPENSE' }),
  });

  const { data: customerSegments } = useQuery({
    queryKey: ['customer-segments'],
    queryFn: () => api.get('/analytics/customer-segments'),
  });

  const { data: productPerformance, isLoading: productsLoading } = useQuery<ProductPerformance[]>({
    queryKey: ['product-performance'],
    queryFn: async () => { const r = await api.get('/analytics/product-performance', { limit: 10 }); return (Array.isArray(r) ? r : []) as ProductPerformance[]; },
  });

  const detectAnomaliesMutation = useMutation({
    mutationFn: () => api.post('/analytics/detect-anomalies', {}),
    onSuccess: (data) => {
      setAnomalyResults(data as Anomaly[]);
    },
  });

  const anomalyList = anomalyResults || [];

  const maxRevenue = Math.max(...(revenueSeries as any[])?.map((i: any) => Math.max(i.income || 0, i.expense || 0)) || [1], 1);

  const exportCSV = () => {
    const rows = (revenueSeries as any[]) || [];
    const header = 'Data,Receita,Despesa,Lucro\n';
    const body = rows.map(r => `${r.date},${r.income},${r.expense},${r.profit}`).join('\n');

    const products = (productPerformance as any[]) || [];
    const prodHeader = '\n\nProdutos\nNome,SKU,Preco Venda,Preco Custo,Margem%,Estoque,Estoque Min\n';
    const prodBody = products.map(p => `${p.name},${p.sku},${p.salePrice},${p.costPrice},${p.margin},${p.stockQuantity},${p.minStock}`).join('\n');

    const anomHeader = '\n\nAnomalias\nTipo,Severidade,Descricao\n';
    const anomBody = anomalyList.map(a => `${anomalyTypeLabels[a.type] || a.type},${a.severity},"${a.description}"`).join('\n');

    const blob = new Blob([header + body + prodHeader + prodBody + anomHeader + anomBody], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const segmentColors: Record<string, string> = {
    VIP: 'bg-purple-500',
    REGULAR: 'bg-blue-500',
    NEW: 'bg-green-500',
    AT_RISK: 'bg-yellow-500',
    CHURNED: 'bg-red-500',
  };

  const totalSegmentCount = (customerSegments as any[])?.reduce((sum: number, s: any) => sum + (s.count || 0), 0) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => detectAnomaliesMutation.mutate()}
            disabled={detectAnomaliesMutation.isPending}
            className="gap-2"
          >
            {detectAnomaliesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Detectar Anomalias
          </Button>
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {metricsLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-600" /> Receita Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics?.income || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">{metrics?.totalTransactions || 0} transações</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-600" /> Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics?.expense || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Margem: {metrics?.averageMargin?.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" /> Clientes Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics?.activeCustomers || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{metrics?.totalProducts || 0} produtos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-600" /> Inadimplência</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{metrics?.overdueCount || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">contas em atraso</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Anomalies Panel - only shown after detection */}
      {anomalyList.length > 0 && (
        <Card className="border-orange-300 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              Anomalias Detectadas ({anomalyList.length})
            </CardTitle>
            <CardDescription>Problemas identificados pela análise automática</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalyList.map((anomaly, index) => {
                const config = severityConfig[anomaly.severity] || severityConfig.LOW;
                const Icon = config.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-card border">
                    <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{anomalyTypeLabels[anomaly.type] || anomaly.type}</span>
                        <Badge variant={config.badge}>{anomaly.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {detectAnomaliesMutation.isError && (
        <Card className="border-red-300">
          <CardContent className="py-4">
            <p className="text-sm text-red-600">Erro ao detectar anomalias. Tente novamente.</p>
          </CardContent>
        </Card>
      )}

      {/* Revenue vs Expense Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Evolução Receita x Despesa</CardTitle>
              <CardDescription>Últimos 12 meses</CardDescription>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Receita</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded" /> Despesa</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {revenueSeries?.length ? (
            <div className="space-y-3">
              {(revenueSeries as any[]).slice(-6).map((item) => (
                <div key={item.date} className="space-y-1">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="w-20 font-mono text-muted-foreground">{item.date}</span>
                    <div className="flex-1 space-y-1">
                      <div className="bg-green-500/20 h-5 rounded relative overflow-hidden">
                        <div className="bg-green-500 h-5 rounded transition-all" style={{ width: `${Math.min(100, (item.income / maxRevenue) * 100)}%` }}>
                          <span className="absolute left-2 text-xs font-medium text-white whitespace-nowrap">{formatCurrency(item.income)}</span>
                        </div>
                      </div>
                      <div className="bg-red-500/20 h-5 rounded relative overflow-hidden">
                        <div className="bg-red-500 h-5 rounded transition-all" style={{ width: `${Math.min(100, (item.expense / maxRevenue) * 100)}%` }}>
                          <span className="absolute left-2 text-xs font-medium text-white whitespace-nowrap">{formatCurrency(item.expense)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`w-28 text-right text-sm font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.profit >= 0 ? '+' : ''}{formatCurrency(item.profit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Sem dados ainda</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Products Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" /> Top Produtos</CardTitle>
            <CardDescription>Desempenho por margem e estoque</CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : productPerformance && productPerformance.length > 0 ? (
              <div className="space-y-3">
                {productPerformance.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-sm font-medium">{formatCurrency(Number(product.salePrice))}</span>
                        <Badge variant={product.margin >= 30 ? 'default' : product.margin >= 15 ? 'secondary' : 'destructive'} className="text-xs">
                          {product.margin.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <span className={`text-xs ${product.isLowStock ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                          Estoque: {product.stockQuantity}
                        </span>
                        {product.isLowStock && <AlertTriangle className="h-3 w-3 text-red-500" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sem produtos</p>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown?.length ? (
              <div className="space-y-3">
                {(categoryBreakdown as any[]).map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{cat.name}</span>
                      <span className="font-medium">{formatCurrency(cat.value)} ({cat.percentage}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className="bg-red-500 h-3 rounded-full transition-all" style={{ width: `${cat.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5" /> Segmentos de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {customerSegments?.length ? (
              <div className="space-y-4">
                {/* Horizontal bar */}
                <div className="flex h-8 rounded-full overflow-hidden">
                  {(customerSegments as any[]).map((s: any) => (
                    <div
                      key={s.segment}
                      className={`${segmentColors[s.segment] || 'bg-gray-500'} flex items-center justify-center text-xs text-white font-medium transition-all`}
                      style={{ width: `${((s.count || 0) / totalSegmentCount) * 100}%` }}
                      title={`${s.segment}: ${s.count}`}
                    >
                      {((s.count / totalSegmentCount) * 100) > 8 && s.segment}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="space-y-2">
                  {(customerSegments as any[]).map((s: any) => (
                    <div key={s.segment} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded ${segmentColors[s.segment] || 'bg-gray-500'}`} />
                        <span>{s.segment}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{s.count}</span>
                        <span className="text-muted-foreground ml-2">({formatCurrency(s.totalLtv)} LTV)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Profit Summary */}
        <Card>
          <CardHeader><CardTitle>Resumo de Lucro</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics?.income || 0)}</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Despesa Total</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics?.expense || 0)}</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                <p className={`text-2xl font-bold ${(metrics?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics?.profit || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
