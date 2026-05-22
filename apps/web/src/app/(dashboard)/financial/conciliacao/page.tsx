'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@openbusinessos/utils';
import { useState } from 'react';

export default function ConciliacaoPage() {
  const queryClient = useQueryClient();
  const [conciliationId, setConciliationId] = useState(`conc_${Date.now()}`);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: overdue, isLoading } = useQuery({
    queryKey: ['overdue-transactions'],
    queryFn: () => api.get('/financial/transactions', { status: 'OVERDUE', perPage: 100 }).then((r: any) => r.data || []),
  });

  const { data: pending } = useQuery({
    queryKey: ['pending-transactions'],
    queryFn: () => api.get('/financial/transactions', { status: 'PENDING', perPage: 100 }).then((r: any) => r.data || []),
  });

  const checkOverdue = useMutation({
    mutationFn: () => api.post('/financial/check-overdue'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overdue-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-transactions'] });
    },
  });

  const conciliate = useMutation({
    mutationFn: (items: any[]) =>
      api.post('/financial/conciliate', { conciliationId, items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overdue-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-transactions'] });
      setSelectedIds(new Set());
      setConciliationId(`conc_${Date.now()}`);
    },
  });

  const allTransactions = [...(overdue || []), ...(pending || [])];
  const selected = allTransactions.filter((t: any) => selectedIds.has(t.id));

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleConciliate = () => {
    if (selected.length === 0) return;
    conciliate.mutate(
      selected.map((t: any) => ({
        transactionId: t.id,
        paidAt: new Date().toISOString(),
        paymentMethod: 'BANK_TRANSFER',
        bankReference: '',
      })),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Conciliação Bancária</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => checkOverdue.mutate()}>
            Verificar Atrasados
          </Button>
          <Button onClick={handleConciliate} disabled={selected.length === 0}>
            Conciliar ({selected.length} selecionados)
          </Button>
        </div>
      </div>

      {/* Info */}
      <Card>
        <CardHeader><CardTitle>Conciliação ID</CardTitle></CardHeader>
        <CardContent>
          <Input value={conciliationId} onChange={(e) => setConciliationId(e.target.value)} className="max-w-md" />
          <p className="text-xs text-muted-foreground mt-1">Identificador único para este lote de conciliação</p>
        </CardContent>
      </Card>

      {/* Overdue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Transações em Atraso ({overdue?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Carregando...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 text-left w-10">
                      <input type="checkbox" onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(new Set(overdue?.map((t: any) => t.id) || []));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }} />
                    </th>
                    <th className="text-left py-2 px-3">Descrição</th>
                    <th className="text-right py-2 px-3">Valor</th>
                    <th className="text-left py-2 px-3">Vencimento</th>
                    <th className="text-left py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {overdue?.map((tx: any) => (
                    <tr key={tx.id} className={`border-b hover:bg-muted/50 ${selectedIds.has(tx.id) ? 'bg-primary/5' : ''}`}>
                      <td className="py-2 px-3">
                        <input type="checkbox" checked={selectedIds.has(tx.id)} onChange={() => toggleSelect(tx.id)} />
                      </td>
                      <td className="py-2 px-3">{tx.description}</td>
                      <td className="py-2 px-3 text-right text-red-600 font-medium">{formatCurrency(Number(tx.amount))}</td>
                      <td className="py-2 px-3">{formatDate(tx.dueDate)}</td>
                      <td className="py-2 px-3"><span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">ATRASADO</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-600">Pendentes ({pending?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-3 text-left w-10">
                    <input type="checkbox" onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(pending?.map((t: any) => t.id) || []));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }} />
                  </th>
                  <th className="text-left py-2 px-3">Descrição</th>
                  <th className="text-right py-2 px-3">Valor</th>
                  <th className="text-left py-2 px-3">Vencimento</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {pending?.map((tx: any) => (
                  <tr key={tx.id} className={`border-b hover:bg-muted/50 ${selectedIds.has(tx.id) ? 'bg-primary/5' : ''}`}>
                    <td className="py-2 px-3">
                      <input type="checkbox" checked={selectedIds.has(tx.id)} onChange={() => toggleSelect(tx.id)} />
                    </td>
                    <td className="py-2 px-3">{tx.description}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(Number(tx.amount))}</td>
                    <td className="py-2 px-3">{formatDate(tx.dueDate)}</td>
                    <td className="py-2 px-3"><span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">PENDENTE</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
