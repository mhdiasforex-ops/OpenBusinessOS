'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
} from 'lucide-react';

// ── Currency formatter ────────────────────────────────────────────

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

// ── Category options ──────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todas as Categorias' },
  { value: 'VENDAS', label: 'Vendas' },
  { value: 'SERVICOS', label: 'Serviços' },
  { value: 'ASSINATURAS', label: 'Assinaturas' },
  { value: 'MATERIAIS', label: 'Materiais' },
  { value: 'ELETRONICOS', label: 'Eletrônicos' },
  { value: 'ALIMENTOS', label: 'Alimentos' },
  { value: 'OUTROS', label: 'Outros' },
];

// ── Page component ────────────────────────────────────────────────

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // ── Queries ────────────────────────────────────────────────────

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products'),
  });

  // ── Mutations ──────────────────────────────────────────────────

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/products/${id}`, { isActive }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  // ── Derived data ───────────────────────────────────────────────

  const allProducts = useMemo(() => {
    const raw = (products as any)?.data ?? products ?? [];
    if (!Array.isArray(raw)) return [];
    return raw;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = allProducts;
    if (categoryFilter) {
      list = list.filter((p: any) => p.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allProducts, categoryFilter, search]);

  // ── KPIs ───────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const total = allProducts.length;
    const lowStock = allProducts.filter(
      (p: any) =>
        p.isActive !== false &&
        Number(p.stockQuantity ?? 0) <= Number(p.minStock ?? 0),
    ).length;
    const stockValue = allProducts
      .filter((p: any) => p.isActive !== false)
      .reduce(
        (sum: number, p: any) =>
          sum + Number(p.stockQuantity ?? 0) * Number(p.costPrice ?? 0),
        0,
      );
    const active = allProducts.filter(
      (p: any) => p.isActive !== false,
    ).length;
    return { total, lowStock, stockValue, active };
  }, [allProducts]);

  // ── Helpers ────────────────────────────────────────────────────

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Link href="/products/novo">
          <Button>
            <Package className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </Link>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.total}</p>
            <p className="text-xs text-muted-foreground">cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{kpis.lowStock}</p>
            <p className="text-xs text-muted-foreground">abaixo do mínimo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBRL(kpis.stockValue)}</p>
            <p className="text-xs text-muted-foreground">custo total do estoque</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{kpis.active}</p>
            <p className="text-xs text-muted-foreground">ativos para venda</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Search & Filter Bar ────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto por nome ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={CATEGORY_OPTIONS}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-48"
        />
        {(search || categoryFilter) && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Products Table ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">Carregando produtos...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum produto encontrado com os filtros aplicados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Preço Custo</TableHead>
                  <TableHead className="text-right">Preço Venda</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p: any) => {
                  const isLowStock =
                    Number(p.stockQuantity ?? 0) <= Number(p.minStock ?? 0);
                  const isInactive = p.isActive === false;

                  // Badge variant for Situação column
                  let badgeVariant: 'success' | 'warning' | 'destructive' | 'secondary' = 'success';
                  let badgeLabel = 'Ativo';
                  if (isInactive) {
                    badgeVariant = 'secondary';
                    badgeLabel = 'Inativo';
                  } else if (isLowStock) {
                    badgeVariant = 'warning';
                    badgeLabel = 'Estoque Baixo';
                  }

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {p.sku || '-'}
                      </TableCell>
                      <TableCell>{p.category || '-'}</TableCell>
                      <TableCell className="text-right">
                        {formatBRL(Number(p.costPrice ?? 0))}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatBRL(Number(p.salePrice ?? 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(p.stockQuantity ?? 0)}
                        {p.unit ? ` ${p.unit}` : ''}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/products/${p.id}`}>
                            <Button variant="outline" size="sm" title="Editar">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            title={isInactive ? 'Ativar' : 'Desativar'}
                            disabled={toggleMutation.isPending}
                            onClick={() =>
                              toggleMutation.mutate({
                                id: p.id,
                                isActive: !isInactive,
                              })
                            }
                          >
                            {isInactive ? (
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            title="Excluir"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir este produto?')) {
                                deleteMutation.mutate(p.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
