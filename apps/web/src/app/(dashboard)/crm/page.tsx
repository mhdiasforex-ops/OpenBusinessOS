'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatCurrency } from '@openbusinessos/utils';
import { useState } from 'react';
import Link from 'next/link';

export default function CrmPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get('/crm/customers', { search }),
  });

  const { data: segments } = useQuery({
    queryKey: ['customer-segments'],
    queryFn: () => api.get('/analytics/customer-segments'),
  });

  const segmentMutation = useMutation({
    mutationFn: () => api.post('/crm/segment'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });

  const segmentColors: Record<string, string> = {
    VIP: 'bg-purple-100 text-purple-800',
    REGULAR: 'bg-blue-100 text-blue-800',
    NEW: 'bg-green-100 text-green-800',
    AT_RISK: 'bg-yellow-100 text-yellow-800',
    CHURNED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">CRM — Clientes</h1>
        <Button onClick={() => segmentMutation.mutate()}>🔄 Recalcular Segmentos</Button>
      </div>

      {/* Segment Overview */}
      {segments && Array.isArray(segments) && (
        <div className="grid gap-4 md:grid-cols-5">
          {(segments as any[]).map((s) => (
            <Card key={s.segment}>
              <CardHeader><CardTitle className="text-sm">{s.segment}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs text-muted-foreground">LTV total: {formatCurrency(s.totalLtv)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar cliente por nome, email ou documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader><CardTitle>Clientes</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Nome</th>
                    <th className="text-left py-2 px-3">Email</th>
    <th className="text-left py-2 px-3">Telefone</th>
    <th className="text-left py-2 px-3">Segmento</th>
    <th className="text-right py-2 px-3">LTV</th>
    <th className="text-right py-2 px-3">Pedidos</th>
    <th className="text-right py-2 px-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {(customers as any)?.data?.map((c: any) => (
                    <tr key={c.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">{c.name}</td>
                      <td className="py-2 px-3">{c.email}</td>
                      <td className="py-2 px-3">{c.phone || '-'}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${segmentColors[c.segment] || ''}`}>{c.segment}</span>
                      </td>
                      <td className="py-2 px-3 text-right">{formatCurrency(Number(c.ltv))}</td>
                      <td className="py-2 px-3 text-right">{c.totalOrders}</td>
    <td className="py-2 px-3 text-right">
      <Link href={`/crm/${c.id}`} className="text-primary hover:underline text-sm">Ver</Link>
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
