'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useState, useMemo } from 'react';
import { ShoppingCart, Search, Plus, DollarSign, TrendingUp, FileText, Eye } from 'lucide-react';

export default function SalesPage() {
  const [tab, setTab] = useState<'orders' | 'summary'>('orders');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => api.get('/sales/orders'),
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['sales-summary'],
    queryFn: () => api.get('/sales/orders/summary'),
  });

  const allOrders = useMemo(() => {
    const raw = (orders as any)?.data ?? orders ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let list = allOrders;
    if (statusFilter) list = list.filter((o: any) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o: any) =>
        o.number?.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.notes?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allOrders, search, statusFilter]);

  const summ = (summary as any) || {};

  const orderStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      DRAFT: { label: 'Rascunho', variant: 'outline' },
      CONFIRMED: { label: 'Confirmado', variant: 'default' },
      IN_PROGRESS: { label: 'Em Andamento', variant: 'secondary' },
      SHIPPED: { label: 'Enviado', variant: 'secondary' },
      DELIVERED: { label: 'Entregue', variant: 'default' },
      CANCELLED: { label: 'Cancelado', variant: 'destructive' },
      REFUNDED: { label: 'Reembolsado', variant: 'destructive' },
    };
    const info = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const orderTypeBadge = (type: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      SALE: { label: 'Venda', variant: 'default' },
      QUOTE: { label: 'Orcamento', variant: 'secondary' },
      PROPOSAL: { label: 'Proposta', variant: 'outline' },
    };
    const info = map[type] || { label: type, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const statuses = ['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

  const tabs = [
    { key: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { key: 'summary', label: 'Resumo', icon: TrendingUp },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vendas</h1>
        <Button><Plus className="h-4 w-4 mr-2" />Novo Pedido</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">R$ {Number(summ.totalSold || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{summ.totalOrders || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">R$ {Number(summ.averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{filteredOrders.filter((o: any) => !['CANCELLED', 'REFUNDED'].includes(o.status)).length}</div></CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-t-md transition-colors ${tab === t.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {tab === 'orders' && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por numero, cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
            <option value="">Todos os status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Orders Table */}
      {tab === 'orders' && (
        <Card>
          <CardHeader><CardTitle>Pedidos</CardTitle></CardHeader>
          <CardContent>
            {loadingOrders ? <p className="text-muted-foreground">Carregando...</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.number}</TableCell>
                      <TableCell>{o.customer?.name || o.customerId}</TableCell>
                      <TableCell>{orderTypeBadge(o.type)}</TableCell>
                      <TableCell>{orderStatusBadge(o.status)}</TableCell>
                      <TableCell>R$ {Number(o.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{o.dueDate ? new Date(o.dueDate).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell>{new Date(o.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                  {filteredOrders.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum pedido encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {tab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Pedidos por Status</CardTitle></CardHeader>
            <CardContent>
              {loadingSummary ? <p className="text-muted-foreground">Carregando...</p> : (
                <div className="space-y-3">
                  {Object.entries(summ.ordersByStatus || {}).map(([status, count]: [string, any]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm">{status}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, (Number(count) / Math.max(summ.totalOrders || 1, 1)) * 100)}%` }} />
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Pedidos por Tipo</CardTitle></CardHeader>
            <CardContent>
              {loadingSummary ? <p className="text-muted-foreground">Carregando...</p> : (
                <div className="space-y-3">
                  {Object.entries(summ.ordersByType || {}).map(([type, count]: [string, any]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">{type === 'SALE' ? 'Vendas' : type === 'QUOTE' ? 'Orcamentos' : 'Propostas'}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, (Number(count) / Math.max(summ.totalOrders || 1, 1)) * 100)}%` }} />
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
