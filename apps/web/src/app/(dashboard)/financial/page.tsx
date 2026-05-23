'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { formatCurrency, formatDate } from '@openbusinessos/utils';
import { useState, useMemo } from 'react';

// ── Status badge helpers ──────────────────────────────────────────

const statusLabel: Record<string, string> = {
  PAID: 'PAGO',
  PENDING: 'PENDENTE',
  OVERDUE: 'VENCIDO',
  CANCELLED: 'CANCELADO',
};

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  PAID: 'success',
  PENDING: 'warning',
  OVERDUE: 'destructive',
  CANCELLED: 'secondary',
};

const typeLabel: Record<string, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
};

// ── Filter options ────────────────────────────────────────────────

const tipoOptions = [
  { value: '', label: 'Todos os tipos' },
  { value: 'INCOME', label: 'Receita' },
  { value: 'EXPENSE', label: 'Despesa' },
];

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'PAID', label: 'Pago' },
  { value: 'OVERDUE', label: 'Vencido' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const categoriaOptions = [
  { value: '', label: 'Todas as categorias' },
  { value: 'VENDAS', label: 'Vendas' },
  { value: 'SERVICOS', label: 'Serviços' },
  { value: 'ASSINATURAS', label: 'Assinaturas' },
  { value: 'SALARIOS', label: 'Salários' },
  { value: 'ALUGUEL', label: 'Aluguel' },
  { value: 'IMPOSTOS', label: 'Impostos' },
  { value: 'FORNECEDORES', label: 'Fornecedores' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'TECNOLOGIA', label: 'Tecnologia' },
  { value: 'OUTROS', label: 'Outros' },
];

// ── Page component ────────────────────────────────────────────────

export default function FinancialPage() {
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');

  // New transaction dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    description: '',
    type: 'EXPENSE',
    amount: '',
    dueDate: '',
    category: 'OUTROS',
    status: 'PENDING',
  });

  // ── Queries ────────────────────────────────────────────────────

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', tipoFilter, statusFilter, startDate, endDate],
    queryFn: () =>
      api.get('/financial/transactions', {
        ...(tipoFilter && { type: tipoFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      }),
  });

  const { data: cashFlow } = useQuery({
    queryKey: ['cash-flow'],
    queryFn: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return api.get('/financial/cash-flow', {
        startDate: start.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      });
    },
  });

  // ── Mutations ──────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/financial/transactions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      setDialogOpen(false);
      setForm({
        description: '',
        type: 'EXPENSE',
        amount: '',
        dueDate: '',
        category: 'OUTROS',
        status: 'PENDING',
      });
    },
  });

  const payMutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: string }) =>
      api.post(`/financial/transactions/${id}/pay`, { paymentMethod: method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/financial/transactions/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
    },
  });

  // ── Derived data ───────────────────────────────────────────────

  const cf = cashFlow as any;
  const txData = transactions as any;
  const allTransactions: any[] = txData?.data ?? [];

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return allTransactions;
    const q = search.toLowerCase();
    return allTransactions.filter(
      (tx: any) =>
        tx.description?.toLowerCase().includes(q) ||
        tx.category?.toLowerCase().includes(q),
    );
  }, [allTransactions, search]);

  // Category filter (client-side)
  const displayed = useMemo(() => {
    if (!categoriaFilter) return filtered;
    return filtered.filter((tx: any) => tx.category === categoriaFilter);
  }, [filtered, categoriaFilter]);

  // KPI computation
  const totalReceita = allTransactions
    .filter((tx: any) => tx.type === 'INCOME' && tx.status === 'PAID')
    .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

  const totalDespesas = allTransactions
    .filter((tx: any) => tx.type === 'EXPENSE' && tx.status === 'PAID')
    .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

  const saldo = totalReceita - totalDespesas;

  const contasVencer = allTransactions.filter(
    (tx: any) => tx.status === 'PENDING' || tx.status === 'OVERDUE',
  ).length;

  // Use cash-flow summary if available, otherwise fall back to computed values
  const receita = cf?.summary?.totalInflow ?? totalReceita;
  const despesas = cf?.summary?.totalOutflow ?? totalDespesas;
  const saldoFinal = cf?.summary?.netFlow ?? saldo;

  // ── Handlers ───────────────────────────────────────────────────

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      description: form.description,
      type: form.type,
      amount: Number(form.amount),
      dueDate: form.dueDate,
      category: form.category,
      status: form.status,
    });
  };

  const clearFilters = () => {
    setSearch('');
    setTipoFilter('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setCategoriaFilter('');
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão Financeira</h1>
        <Button onClick={() => setDialogOpen(true)}>+ Nova Transação</Button>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(Number(receita))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(Number(despesas))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                Number(saldoFinal) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(Number(saldoFinal))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas a Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{contasVencer}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground">Buscar</Label>
              <Input
                placeholder="Buscar por descrição ou categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-[160px]">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select
                options={tipoOptions}
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
              />
            </div>
            <div className="w-[160px]">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
            <div className="w-[160px]">
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <Select
                options={categoriaOptions}
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
              />
            </div>
            <div className="w-[150px]">
              <Label className="text-xs text-muted-foreground">Data início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="w-[150px]">
              <Label className="text-xs text-muted-foreground">Data fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Transactions Table ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Carregando...</p>
          ) : displayed.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nenhuma transação encontrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((tx: any) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      {tx.type === 'INCOME' ? '📥' : '📤'}{' '}
                      {typeLabel[tx.type] || tx.type}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(Number(tx.amount))}
                    </TableCell>
                    <TableCell>{formatDate(tx.dueDate)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[tx.status] || 'secondary'}>
                        {statusLabel[tx.status] || tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.category}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {tx.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              payMutation.mutate({ id: tx.id, method: 'PIX' })
                            }
                            disabled={payMutation.isPending}
                          >
                            Pagar
                          </Button>
                        )}
                        {(tx.status === 'PENDING' || tx.status === 'OVERDUE') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => cancelMutation.mutate(tx.id)}
                            disabled={cancelMutation.isPending}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── New Transaction Dialog ───────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tx-description">Descrição</Label>
              <Input
                id="tx-description"
                placeholder="Ex: Pagamento fornecedor X"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tx-type">Tipo</Label>
                <Select
                  id="tx-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="INCOME">Receita</option>
                  <option value="EXPENSE">Despesa</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-amount">Valor (R$)</Label>
                <Input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tx-due-date">Vencimento</Label>
                <Input
                  id="tx-due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-category">Categoria</Label>
                <Select
                  id="tx-category"
                  options={categoriaOptions.filter((o) => o.value !== '')}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-status">Status</Label>
              <Select
                id="tx-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="PENDING">Pendente</option>
                <option value="PAID">Pago</option>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar Transação'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
