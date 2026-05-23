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
import { Package, Search, Plus, AlertTriangle, ArrowUpDown, ShoppingCart } from 'lucide-react';

export default function InventoryPage() {
  const [tab, setTab] = useState<'movements' | 'lowstock' | 'purchase-orders'>('movements');
  const [search, setSearch] = useState('');

  const { data: movements, isLoading: loadingMovements } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: () => api.get('/inventory/movements'),
  });

  const { data: lowStock, isLoading: loadingLowStock } = useQuery({
    queryKey: ['inventory-low-stock'],
    queryFn: () => api.get('/inventory/low-stock'),
  });

  const { data: purchaseOrders, isLoading: loadingPO } = useQuery({
    queryKey: ['inventory-purchase-orders'],
    queryFn: () => api.get('/inventory/purchase-orders'),
  });

  const allMovements = useMemo(() => {
    const raw = (movements as any)?.data ?? movements ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [movements]);

  const allLowStock = useMemo(() => {
    const raw = (lowStock as any)?.data ?? lowStock ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [lowStock]);

  const allPO = useMemo(() => {
    const raw = (purchaseOrders as any)?.data ?? purchaseOrders ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [purchaseOrders]);

  const filteredMovements = useMemo(() => {
    if (!search.trim()) return allMovements;
    const q = search.toLowerCase();
    return allMovements.filter((m: any) =>
      m.product?.name?.toLowerCase().includes(q) ||
      m.reason?.toLowerCase().includes(q) ||
      m.type?.toLowerCase().includes(q)
    );
  }, [allMovements, search]);

  const kpis = useMemo(() => ({
    totalMovements: allMovements.length,
    lowStockItems: allLowStock.length,
    pendingPO: allPO.filter((p: any) => p.status === 'DRAFT' || p.status === 'SENT').length,
    receivedPO: allPO.filter((p: any) => p.status === 'RECEIVED').length,
  }), [allMovements, allLowStock, allPO]);

  const typeBadge = (type: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      IN: { label: 'Entrada', variant: 'default' },
      OUT: { label: 'Saida', variant: 'destructive' },
      ADJUSTMENT: { label: 'Ajuste', variant: 'secondary' },
      TRANSFER: { label: 'Transferencia', variant: 'outline' },
      RETURN: { label: 'Devolucao', variant: 'secondary' },
    };
    const info = map[type] || { label: type, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      DRAFT: { label: 'Rascunho', variant: 'outline' },
      SENT: { label: 'Enviado', variant: 'secondary' },
      CONFIRMED: { label: 'Confirmado', variant: 'default' },
      PARTIALLY_RECEIVED: { label: 'Parcial', variant: 'secondary' },
      RECEIVED: { label: 'Recebido', variant: 'default' },
      CANCELLED: { label: 'Cancelado', variant: 'destructive' },
    };
    const info = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const tabs = [
    { key: 'movements', label: 'Movimentacoes', icon: ArrowUpDown },
    { key: 'lowstock', label: 'Estoque Baixo', icon: AlertTriangle },
    { key: 'purchase-orders', label: 'Pedidos de Compra', icon: ShoppingCart },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Estoque</h1>
        <Button><Plus className="h-4 w-4 mr-2" />Nova Movimentacao</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentacoes</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{kpis.totalMovements}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-500">{kpis.lowStockItems}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{kpis.pendingPO}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Recebidos</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{kpis.receivedPO}</div></CardContent>
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

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Content */}
      {tab === 'movements' && (
        <Card>
          <CardHeader><CardTitle>Movimentacoes de Estoque</CardTitle></CardHeader>
          <CardContent>
            {loadingMovements ? <p className="text-muted-foreground">Carregando...</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.product?.name || m.productId}</TableCell>
                      <TableCell>{typeBadge(m.type)}</TableCell>
                      <TableCell>{m.quantity}</TableCell>
                      <TableCell>{m.reason || '-'}</TableCell>
                      <TableCell>{m.reference || '-'}</TableCell>
                      <TableCell>{new Date(m.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                  {filteredMovements.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma movimentacao encontrada</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'lowstock' && (
        <Card>
          <CardHeader><CardTitle>Produtos com Estoque Baixo</CardTitle></CardHeader>
          <CardContent>
            {loadingLowStock ? <p className="text-muted-foreground">Carregando...</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Minimo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLowStock.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.sku || '-'}</TableCell>
                      <TableCell><span className={p.stockQuantity === 0 ? 'text-red-500 font-bold' : 'text-orange-500 font-bold'}>{p.stockQuantity}</span></TableCell>
                      <TableCell>{p.minStock}</TableCell>
                      <TableCell>{p.stockQuantity === 0 ? <Badge variant="destructive">Zerado</Badge> : <Badge variant="secondary">Baixo</Badge>}</TableCell>
                    </TableRow>
                  ))}
                  {allLowStock.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum produto com estoque baixo</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'purchase-orders' && (
        <Card>
          <CardHeader><CardTitle>Pedidos de Compra</CardTitle></CardHeader>
          <CardContent>
            {loadingPO ? <p className="text-muted-foreground">Carregando...</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Previsao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPO.map((po: any) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.number}</TableCell>
                      <TableCell>{po.supplier?.name || po.supplierId}</TableCell>
                      <TableCell>{statusBadge(po.status)}</TableCell>
                      <TableCell>R$ {Number(po.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{po.expectedAt ? new Date(po.expectedAt).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    </TableRow>
                  ))}
                  {allPO.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum pedido de compra</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
