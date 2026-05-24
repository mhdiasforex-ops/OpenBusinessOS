'use client';


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@openbusinessos/utils';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Users, TrendingUp, AlertTriangle, DollarSign, Search, RefreshCw } from 'lucide-react';

const SEGMENT_OPTIONS = [
  { value: '', label: 'Todos os Segmentos' },
  { value: 'VIP', label: 'VIP' },
  { value: 'REGULAR', label: 'Regular' },
  { value: 'NEW', label: 'Novo' },
  { value: 'AT_RISK', label: 'Em Risco' },
];

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

export default function CrmPage() {
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/crm/customers'),
  });

  const segmentMutation = useMutation({
    mutationFn: () => api.post('/crm/segment'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });

  const allCustomers = useMemo(() => {
    const raw = (customers as any)?.data ?? customers ?? [];
    if (!Array.isArray(raw)) return [];
    return raw;
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    let list = allCustomers;
    if (segmentFilter) {
      list = list.filter((c: any) => c.segment === segmentFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c: any) =>
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.document?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allCustomers, segmentFilter, search]);

  const kpis = useMemo(() => {
    const total = allCustomers.length;
    const totalLtv = allCustomers.reduce((sum: number, c: any) => sum + Number(c.ltv ?? 0), 0);
    const avgLtv = total > 0 ? totalLtv / total : 0;
    const atRisk = allCustomers.filter((c: any) => c.segment === 'AT_RISK' || c.segment === 'CHURNED').length;
    const churnRate = total > 0 ? (atRisk / total) * 100 : 0;
    return { total, avgLtv, churnRate, atRisk };
  }, [allCustomers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">CRM — Clientes</h1>
        <Button onClick={() => segmentMutation.mutate()} disabled={segmentMutation.isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${segmentMutation.isPending ? 'animate-spin' : ''}`} />
          Recalcular Segmentos
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.total}</p>
            <p className="text-xs text-muted-foreground">cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">LTV Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(kpis.avgLtv)}</p>
            <p className="text-xs text-muted-foreground">valor vitalício médio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.churnRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">clientes em risco + churned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes em Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{kpis.atRisk}</p>
            <p className="text-xs text-muted-foreground">requer atenção imediata</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nome, email ou documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={SEGMENT_OPTIONS}
          value={segmentFilter}
          onChange={(e) => setSegmentFilter(e.target.value)}
          className="w-full sm:w-48"
        />
        <span className="text-sm text-muted-foreground">
          {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''} encontrado{filteredCustomers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">Carregando clientes...</span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cliente encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead className="text-right">LTV</TableHead>
                  <TableHead>Último Pedido</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={segmentBadgeVariant[c.segment] || 'outline'}>
                        {segmentLabel[c.segment] || c.segment || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(c.ltv ?? 0))}
                    </TableCell>
                    <TableCell>
                      {c.lastOrderAt ? formatDate(c.lastOrderAt) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/crm/${c.id}`}>
                        <Button variant="outline" size="sm">Ver</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
