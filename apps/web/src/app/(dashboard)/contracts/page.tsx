'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatDate } from '@openbusinessos/utils';
import { useState, useMemo } from 'react';
import { FileSignature, Search, Plus, Eye } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os Status' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'EXPIRED', label: 'Expirado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const contractStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'> = {
  DRAFT: 'secondary',
  ACTIVE: 'success',
  EXPIRED: 'warning',
  CANCELLED: 'destructive',
};

const contractStatusLabel: Record<string, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

export default function ContractsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => api.get('/contracts'),
  });

  const allContracts = useMemo(() => {
    const raw = (contracts as any)?.data ?? contracts ?? [];
    if (!Array.isArray(raw)) return [];
    return raw;
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    let list = allContracts;
    if (statusFilter) list = list.filter((c: any) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c: any) =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.partyName?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allContracts, statusFilter, search]);

  const kpis = useMemo(() => {
    const total = allContracts.length;
    const active = allContracts.filter((c: any) => c.status === 'ACTIVE').length;
    const expiringSoon = allContracts.filter((c: any) => {
      if (!c.endDate) return false;
      const end = new Date(c.endDate);
      const now = new Date();
      const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    }).length;
    const draft = allContracts.filter((c: any) => c.status === 'DRAFT').length;
    return { total, active, expiringSoon, draft };
  }, [allContracts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contratos</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contratos</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{kpis.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expirando em 30d</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{kpis.expiringSoon}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-500">{kpis.draft}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contratos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Contratos ({filteredContracts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum contrato encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Parte</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract: any) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.title}</TableCell>
                    <TableCell>{contract.partyName || '-'}</TableCell>
                    <TableCell>{contract.value ? `R$ ${Number(contract.value).toLocaleString('pt-BR')}` : '-'}</TableCell>
                    <TableCell className="text-sm">{contract.startDate ? formatDate(new Date(contract.startDate)) : '-'}</TableCell>
                    <TableCell className="text-sm">{contract.endDate ? formatDate(new Date(contract.endDate)) : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={contractStatusVariant[contract.status] || 'outline'}>
                        {contractStatusLabel[contract.status] || contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" title="Ver detalhes">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
