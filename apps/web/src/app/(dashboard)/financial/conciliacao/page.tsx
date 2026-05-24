'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatCurrency, formatDate, formatDateTime } from '@openbusinessos/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TransactionType = 'INCOME' | 'EXPENSE';
type TransactionStatus = 'PENDING' | 'PAID' | 'OVERDUE';
type PaymentMethod = 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BANK_TRANSFER';

interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  dueDate: string;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  conciliationId?: string;
  auditTrail?: {
    conciliatedBy?: string;
    conciliatedAt?: string;
  };
}

interface ConciliationItem {
  transactionId: string;
  paidAt: string;
  paymentMethod: PaymentMethod;
  bankReference?: string;
}

interface ConciliationPayload {
  conciliationId: string;
  items: ConciliationItem[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'PIX', label: 'PIX' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de Débito' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'BANK_TRANSFER', label: 'Transferência Bancária' },
];

const STATUS_BADGE_MAP: Record<TransactionStatus, { label: string; variant: 'warning' | 'success' | 'destructive' }> = {
  PENDING: { label: 'Pendente', variant: 'warning' },
  PAID: { label: 'Pago', variant: 'success' },
  OVERDUE: { label: 'Atrasado', variant: 'destructive' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ConciliacaoPage() {
  const queryClient = useQueryClient();

  // ---- State ----
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [conciliationId] = useState(`conc_${Date.now()}`);

  // Single-row conciliation dialog
  const [singleDialogOpen, setSingleDialogOpen] = useState(false);
  const [singleTx, setSingleTx] = useState<Transaction | null>(null);
  const [singleForm, setSingleForm] = useState<{
    paymentDate: string;
    paymentMethod: PaymentMethod;
    bankReference: string;
  }>({
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'PIX',
    bankReference: '',
  });

  // Batch conciliation form
  const [batchForm, setBatchForm] = useState<{
    paymentDate: string;
    paymentMethod: PaymentMethod;
    bankReference: string;
  }>({
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'PIX',
    bankReference: '',
  });

  // ---- Queries ----
  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ['financial-transactions', 'PENDING'],
    queryFn: () =>
      api
        .get('/financial/transactions', { status: 'PENDING', perPage: 100 })
        .then((r: any) => Array.isArray(r) ? r : r?.data ?? []),
  });

  const { data: overdueData, isLoading: loadingOverdue } = useQuery({
    queryKey: ['financial-transactions', 'OVERDUE'],
    queryFn: () =>
      api
        .get('/financial/transactions', { status: 'OVERDUE', perPage: 100 })
        .then((r: any) => Array.isArray(r) ? r : r?.data ?? []),
  });

  const { data: paidData, isLoading: loadingPaid } = useQuery({
    queryKey: ['financial-transactions', 'PAID'],
    queryFn: () =>
      api
        .get('/financial/transactions', { status: 'PAID', perPage: 100 })
        .then((r: any) => Array.isArray(r) ? r : r?.data ?? []),
  });

  // ---- Derived data ----
  const pendingTransactions: Transaction[] = useMemo(
    () => [...(overdueData || []), ...(pendingData || [])] as Transaction[],
    [overdueData, pendingData],
  );

  const conciliatedTransactions: Transaction[] = useMemo(
    () => (paidData || []) as Transaction[],
    [paidData],
  );

  const totalPendente = useMemo(
    () => pendingTransactions.filter((t) => t.status === 'PENDING').reduce((s, t) => s + Number(t.amount), 0),
    [pendingTransactions],
  );

  const totalConciliado = useMemo(
    () => conciliatedTransactions.reduce((s, t) => s + Number(t.amount), 0),
    [conciliatedTransactions],
  );

  const totalAtrasado = useMemo(
    () => pendingTransactions.filter((t) => t.status === 'OVERDUE').reduce((s, t) => s + Number(t.amount), 0),
    [pendingTransactions],
  );

  const countPending = pendingTransactions.length;

  // ---- Mutations ----
  const conciliateMutation = useMutation({
    mutationFn: (payload: ConciliationPayload) =>
      api.post('/financial/conciliation', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      setSelectedIds(new Set());
    },
  });

  // ---- Handlers ----
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = (transactions: Transaction[]) => {
    if (selectedIds.size === transactions.length && transactions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  };

  const openSingleDialog = (tx: Transaction) => {
    setSingleTx(tx);
    setSingleForm({
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'PIX',
      bankReference: '',
    });
    setSingleDialogOpen(true);
  };

  const handleSingleConciliate = () => {
    if (!singleTx) return;
    conciliateMutation.mutate(
      {
        conciliationId: `conc_${Date.now()}`,
        items: [
          {
            transactionId: singleTx.id,
            paidAt: new Date(singleForm.paymentDate + 'T12:00:00').toISOString(),
            paymentMethod: singleForm.paymentMethod,
            bankReference: singleForm.bankReference || undefined,
          },
        ],
      },
      { onSuccess: () => setSingleDialogOpen(false) },
    );
  };

  const handleBatchConciliate = () => {
    if (selectedIds.size === 0) return;
    const items: ConciliationItem[] = Array.from(selectedIds).map((id) => ({
      transactionId: id,
      paidAt: new Date(batchForm.paymentDate + 'T12:00:00').toISOString(),
      paymentMethod: batchForm.paymentMethod,
      bankReference: batchForm.bankReference || undefined,
    }));
    conciliateMutation.mutate({ conciliationId, items });
  };

  // ---- Helpers ----
  const typeLabel = (type: TransactionType) =>
    type === 'INCOME' ? 'Receita' : 'Despesa';

  const isLoading = loadingPending || loadingOverdue;

  // ======================================================================
  // Render
  // ======================================================================

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Conciliação Bancária</h1>
      </div>

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(totalPendente)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Conciliado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalConciliado)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalAtrasado)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{countPending}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes">
            Pendentes ({countPending})
          </TabsTrigger>
          <TabsTrigger value="conciliados">
            Conciliados ({conciliatedTransactions.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Pendentes Tab ──────────────────────────────────────────── */}
        <TabsContent value="pendentes" className="space-y-4">
          {/* Batch conciliation bar */}
          {selectedIds.size > 0 && (
            <Card>
              <CardContent className="flex flex-wrap items-end gap-4 pt-6">
                <div className="flex-1 min-w-[160px]">
                  <Label htmlFor="batch-date">Data do Pagamento</Label>
                  <Input
                    id="batch-date"
                    type="date"
                    value={batchForm.paymentDate}
                    onChange={(e) =>
                      setBatchForm((f) => ({ ...f, paymentDate: e.target.value }))
                    }
                  />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <Label>Método de Pagamento</Label>
                  <Select
                    value={batchForm.paymentMethod}
                    onChange={(e) =>
                      setBatchForm((f) => ({
                        ...f,
                        paymentMethod: e.target.value as PaymentMethod,
                      }))
                    }
                    options={PAYMENT_METHOD_OPTIONS}
                  />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <Label htmlFor="batch-ref">Referência Bancária</Label>
                  <Input
                    id="batch-ref"
                    placeholder="Opcional"
                    value={batchForm.bankReference}
                    onChange={(e) =>
                      setBatchForm((f) => ({ ...f, bankReference: e.target.value }))
                    }
                  />
                </div>
                <Button
                  onClick={handleBatchConciliate}
                  disabled={conciliateMutation.isPending}
                >
                  {conciliateMutation.isPending
                    ? 'Conciliando...'
                    : `Conciliar Selecionados (${selectedIds.size})`}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pending transactions table */}
          <Card>
            <CardHeader>
              <CardTitle>Transações Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground py-4">Carregando...</p>
              ) : pendingTransactions.length === 0 ? (
                <p className="text-muted-foreground py-4">
                  Nenhuma transação pendente encontrada.
                </p>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <input
                          type="checkbox"
                          checked={
                            pendingTransactions.length > 0 &&
                            selectedIds.size === pendingTransactions.length
                          }
                          onChange={() => toggleSelectAll(pendingTransactions)}
                        />
                      </TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTransactions.map((tx) => {
                      const badge = STATUS_BADGE_MAP[tx.status];
                      return (
                        <TableRow
                          key={tx.id}
                          className={
                            selectedIds.has(tx.id) ? 'bg-primary/5' : undefined
                          }
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(tx.id)}
                              onChange={() => toggleSelect(tx.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                tx.type === 'INCOME'
                                  ? 'text-emerald-600 font-medium'
                                  : 'text-red-600 font-medium'
                              }
                            >
                              {typeLabel(tx.type)}
                            </span>
                          </TableCell>
                          <TableCell>{tx.description}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(Number(tx.amount))}
                          </TableCell>
                          <TableCell>{formatDate(tx.dueDate)}</TableCell>
                          <TableCell>
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openSingleDialog(tx)}
                            >
                              Conciliar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Conciliados Tab ────────────────────────────────────────── */}
        <TabsContent value="conciliados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações Conciliadas</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPaid ? (
                <p className="text-muted-foreground py-4">Carregando...</p>
              ) : conciliatedTransactions.length === 0 ? (
                <p className="text-muted-foreground py-4">
                  Nenhuma transação conciliada encontrada.
                </p>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Conciliado por</TableHead>
                      <TableHead>Conciliado em</TableHead>
                      <TableHead>ID Conciliação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conciliatedTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <span
                            className={
                              tx.type === 'INCOME'
                                ? 'text-emerald-600 font-medium'
                                : 'text-red-600 font-medium'
                            }
                          >
                            {typeLabel(tx.type)}
                          </span>
                        </TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(tx.amount))}
                        </TableCell>
                        <TableCell>{formatDate(tx.dueDate)}</TableCell>
                        <TableCell>
                          {tx.paidAt ? formatDateTime(tx.paidAt) : '—'}
                        </TableCell>
                        <TableCell>
                          {tx.paymentMethod
                            ? PAYMENT_METHOD_OPTIONS.find(
                                (o) => o.value === tx.paymentMethod,
                              )?.label ?? tx.paymentMethod
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {tx.auditTrail?.conciliatedBy ?? '—'}
                        </TableCell>
                        <TableCell>
                          {tx.auditTrail?.conciliatedAt
                            ? formatDateTime(tx.auditTrail.conciliatedAt)
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-muted-foreground">
                            {tx.conciliationId ?? '—'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Single conciliation dialog ──────────────────────────────── */}
      <Dialog open={singleDialogOpen} onOpenChange={setSingleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conciliar Transação</DialogTitle>
            <DialogDescription>
              {singleTx
                ? `${singleTx.description} — ${formatCurrency(Number(singleTx.amount))}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="single-date">Data do Pagamento</Label>
              <Input
                id="single-date"
                type="date"
                value={singleForm.paymentDate}
                onChange={(e) =>
                  setSingleForm((f) => ({ ...f, paymentDate: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Método de Pagamento</Label>
              <Select
                value={singleForm.paymentMethod}
                onChange={(e) =>
                  setSingleForm((f) => ({
                    ...f,
                    paymentMethod: e.target.value as PaymentMethod,
                  }))
                }
                options={PAYMENT_METHOD_OPTIONS}
              />
            </div>

            <div>
              <Label htmlFor="single-ref">Referência Bancária</Label>
              <Input
                id="single-ref"
                placeholder="Opcional"
                value={singleForm.bankReference}
                onChange={(e) =>
                  setSingleForm((f) => ({
                    ...f,
                    bankReference: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSingleDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSingleConciliate}
                disabled={conciliateMutation.isPending}
              >
                {conciliateMutation.isPending ? 'Conciliando...' : 'Conciliar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
