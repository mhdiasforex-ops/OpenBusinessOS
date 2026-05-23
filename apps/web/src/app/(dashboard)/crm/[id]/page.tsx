'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@openbusinessos/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag, TrendingUp, Calendar, FileText, BarChart3 } from 'lucide-react';

const segmentBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'> = {
  VIP: 'default',
  REGULAR: 'info',
  NEW: 'success',
  AT_RISK: 'warning',
  CHURNED: 'destructive',
};

const segmentLabel: Record<string, string> = {
  VIP: 'VIP',
  REGULAR: 'Regular',
  NEW: 'Novo',
  AT_RISK: 'Em Risco',
  CHURNED: 'Churned',
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => api.get(`/crm/customers/${customerId}`).then((r: any) => r.data || r),
  });

  const { data: ltvData } = useQuery({
    queryKey: ['customer-ltv', customerId],
    queryFn: () => api.get(`/crm/customers/${customerId}/ltv`).then((r: any) => r.data || r),
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['customer-transactions', customerId],
    queryFn: () => api.get(`/crm/customers/${customerId}/transactions`).then((r: any) => r.data || r),
  });

  const c = customer as any;
  const ltv = ltvData as any;
  const transactions = useMemo(() => {
    const raw = (transactionsData as any)?.data ?? transactionsData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [transactionsData]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  if (!c) return <div className="p-8 text-center text-muted-foreground">Cliente não encontrado</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{c.name}</h1>
            {c.segment && (
              <Badge variant={segmentBadgeVariant[c.segment] || 'outline'}>
                {segmentLabel[c.segment] || c.segment}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Cliente desde {formatDate(c.createdAt)}</p>
        </div>
      </div>

      {/* Contact & Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><Mail className="h-3 w-3 text-muted-foreground" /> {c.email || '-'}</p>
            <p className="flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" /> {c.phone || '-'}</p>
            <p className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground" /> {c.address || '-'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{c.totalOrders ?? 0}</p>
            <p className="text-xs text-muted-foreground">Último: {c.lastOrderAt ? formatDate(c.lastOrderAt) : 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> LTV</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{formatCurrency(Number(c.ltv ?? 0))}</p>
            <p className="text-xs text-muted-foreground">Ticket médio: {formatCurrency(Number(ltv?.avgTicket ?? c.avgTicket ?? 0))}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: LTV, Transações, Dados Cadastrais */}
      <Tabs defaultValue="ltv">
        <TabsList>
          <TabsTrigger value="ltv">
            <BarChart3 className="h-4 w-4 mr-1" /> LTV & Métricas
          </TabsTrigger>
          <TabsTrigger value="transacoes">
            <FileText className="h-4 w-4 mr-1" /> Histórico de Transações
          </TabsTrigger>
          <TabsTrigger value="cadastro">
            <Calendar className="h-4 w-4 mr-1" /> Dados Cadastrais
          </TabsTrigger>
        </TabsList>

        {/* LTV Tab */}
        <TabsContent value="ltv">
          <Card>
            <CardHeader>
              <CardTitle>LTV — Lifetime Value</CardTitle>
              <CardDescription>Análise detalhada do valor vitalício do cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* LTV Metrics Grid */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Receita Total</p>
                  <p className="text-xl font-bold">{formatCurrency(Number(ltv?.totalRevenue ?? c.ltv ?? 0))}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Ticket Médio</p>
                  <p className="text-xl font-bold">{formatCurrency(Number(ltv?.avgTicket ?? c.avgTicket ?? 0))}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Frequência (meses)</p>
                  <p className="text-xl font-bold">{ltv?.purchaseFrequency ?? '-'}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Risco de Churn</p>
                  <p className={`text-xl font-bold ${
                    (ltv?.churnRisk ?? '') === 'HIGH' ? 'text-red-600' :
                    (ltv?.churnRisk ?? '') === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {ltv?.churnRisk === 'HIGH' ? 'Alto' : ltv?.churnRisk === 'MEDIUM' ? 'Médio' : ltv?.churnRisk === 'LOW' ? 'Baixo' : (ltv?.churnRisk ?? 'Baixo')}
                  </p>
                </div>
              </div>

              {/* LTV Chart — Bar projection */}
              <div>
                <p className="text-sm font-medium mb-3">Projeção LTV (12 meses)</p>
                <div className="flex items-end gap-1 h-32 border-b border-l p-2">
                  {Array.from({ length: 12 }, (_, i) => {
                    const projection = ltv?.monthlyProjection;
                    const val = projection?.[i] ?? (Number(c.ltv ?? 0) / 12) * (i + 1) * 0.1;
                    const allValues = projection || [Number(c.ltv ?? 0)];
                    const maxVal = Math.max(...allValues, 1);
                    const pct = (val / maxVal) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <div
                          className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                          style={{ height: `${Math.max(4, pct)}%` }}
                          title={`Mês ${i + 1}: ${formatCurrency(val)}`}
                        />
                        <span className="text-[10px] text-muted-foreground">{i + 1}m</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LTV not loaded fallback */}
              {!ltv && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Dados de LTV detalhados indisponíveis. Exibindo projeção estimada com base no LTV atual.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transacoes">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>Pedidos e transações do cliente</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada para este cliente.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: any, idx: number) => (
                      <TableRow key={tx.id ?? idx}>
                        <TableCell>{tx.date ? formatDate(tx.date) : tx.createdAt ? formatDate(tx.createdAt) : '-'}</TableCell>
                        <TableCell className="font-medium">{tx.description || tx.productName || `Pedido #${tx.id ?? idx + 1}`}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              tx.status === 'PAID' || tx.status === 'COMPLETED' ? 'success' :
                              tx.status === 'PENDING' ? 'warning' :
                              tx.status === 'CANCELLED' || tx.status === 'REFUNDED' ? 'destructive' : 'outline'
                            }
                          >
                            {tx.status === 'PAID' ? 'Pago' :
                             tx.status === 'COMPLETED' ? 'Concluído' :
                             tx.status === 'PENDING' ? 'Pendente' :
                             tx.status === 'CANCELLED' ? 'Cancelado' :
                             tx.status === 'REFUNDED' ? 'Reembolsado' : tx.status || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(tx.amount ?? tx.total ?? 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cadastro Tab */}
        <TabsContent value="cadastro">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Dados Cadastrais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Nome</p>
                  <p className="font-medium">{c.name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{c.email || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Telefone</p>
                  <p className="font-medium">{c.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Endereço</p>
                  <p className="font-medium">{c.address || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Documento</p>
                  <p className="font-medium">{c.document || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Tipo de Documento</p>
                  <p className="font-medium">{c.documentType || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Criado em</p>
                  <p className="font-medium">{formatDate(c.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Atualizado em</p>
                  <p className="font-medium">{formatDate(c.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
