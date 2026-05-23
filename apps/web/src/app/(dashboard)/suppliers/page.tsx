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
import { Truck, Search, Plus, Eye, Edit } from 'lucide-react';

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers'),
  });

  const allSuppliers = useMemo(() => {
    const raw = (suppliers as any)?.data ?? suppliers ?? [];
    if (!Array.isArray(raw)) return [];
    return raw;
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    let list = allSuppliers;
    if (activeOnly) list = list.filter((s: any) => s.isActive === true);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s: any) =>
          s.name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.document?.toLowerCase().includes(q) ||
          s.phone?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allSuppliers, activeOnly, search]);

  const kpis = useMemo(() => {
    const total = allSuppliers.length;
    const active = allSuppliers.filter((s: any) => s.isActive).length;
    const withContracts = allSuppliers.filter((s: any) => (s._count?.contracts ?? 0) > 0).length;
    const withPO = allSuppliers.filter((s: any) => (s._count?.purchaseOrders ?? 0) > 0).length;
    return { total, active, withContracts, withPO };
  }, [allSuppliers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fornecedores</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Fornecedores</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Com Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{kpis.withContracts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Com Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{kpis.withPO}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded"
          />
          Somente ativos
        </label>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Fornecedores ({filteredSuppliers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum fornecedor encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contratos</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier: any) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{supplier.email || '-'}</TableCell>
                    <TableCell className="text-sm">{supplier.phone || '-'}</TableCell>
                    <TableCell className="text-sm">{supplier.document || '-'}</TableCell>
                    <TableCell>{supplier._count?.contracts ?? 0}</TableCell>
                    <TableCell>{supplier._count?.purchaseOrders ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={supplier.isActive ? 'success' : 'secondary'}>
                        {supplier.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Ver detalhes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
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
