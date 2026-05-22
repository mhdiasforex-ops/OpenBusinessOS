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

export default function FinancialPage() {
  const [showNewTx, setShowNewTx] = useState(false);
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get('/financial/transactions'),
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

  const payMutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: string }) =>
      api.post(`/financial/transactions/${id}/pay`, { paymentMethod: method }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };

  const cf = cashFlow as any;
  const txData = transactions as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão Financeira</h1>
        <Button onClick={() => setShowNewTx(!showNewTx)}>
          {showNewTx ? 'Cancelar' : '+ Nova Transação'}
        </Button>
      </div>

      {/* Summary Cards */}
      {cf?.summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="text-sm">Entradas</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(cf.summary.totalInflow)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Saídas</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(cf.summary.totalOutflow)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Saldo</CardTitle></CardHeader>
            <CardContent><p className={`text-2xl font-bold ${cf.summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(cf.summary.netFlow)}</p></CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader><CardTitle>Transações</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Descrição</th>
                    <th className="text-left py-2 px-3">Tipo</th>
                    <th className="text-right py-2 px-3">Valor</th>
                    <th className="text-left py-2 px-3">Categoria</th>
                    <th className="text-left py-2 px-3">Vencimento</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-right py-2 px-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {txData?.data?.map((tx: any) => (
                    <tr key={tx.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3">{tx.description}</td>
                      <td className="py-2 px-3">{tx.type === 'INCOME' ? '📥 Receita' : tx.type === 'EXPENSE' ? '📤 Despesa' : '🔄 Transferência'}</td>
                      <td className={`py-2 px-3 text-right font-medium ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                      </td>
                      <td className="py-2 px-3">{tx.category}</td>
                      <td className="py-2 px-3">{formatDate(tx.dueDate)}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[tx.status] || ''}`}>{tx.status}</span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {tx.status === 'PENDING' && (
                          <Button size="sm" variant="outline" onClick={() => payMutation.mutate({ id: tx.id, method: 'PIX' })}>
                            Pagar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
