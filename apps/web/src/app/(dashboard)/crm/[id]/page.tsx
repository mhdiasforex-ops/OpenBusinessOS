'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@openbusinessos/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag, TrendingUp, Calendar } from 'lucide-react';

const segmentColors: Record<string, string> = {
  VIP: 'bg-purple-100 text-purple-800',
  REGULAR: 'bg-blue-100 text-blue-800',
  NEW: 'bg-green-100 text-green-800',
  AT_RISK: 'bg-yellow-100 text-yellow-800',
  CHURNED: 'bg-red-100 text-red-800',
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => api.get(`/crm/customers/${customerId}`).then((r: any) => r.data || r),
  });

  const { data: ltvData } = useQuery({
    queryKey: ['customer-ltv', customerId],
    queryFn: () => api.get(`/crm/customers/${customerId}/ltv`).then((r: any) => r.data || r),
  });

  const c = customer as any;
  const ltv = ltvData as any;

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  if (!c) return <div className="p-8 text-center text-muted-foreground">Cliente não encontrado</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{c.name}</h1>
          <p className="text-sm text-muted-foreground">Cliente desde {formatDate(c.createdAt)}</p>
        </div>
        {c.segment && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${segmentColors[c.segment] || ''}`}>
            {c.segment}
          </span>
        )}
      </div>

      {/* Contact Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{c.email || '-'}</p>
            <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone || '-'}</p>
            <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.address || '-'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{c.totalOrders ?? 0}</p>
            <p className="text-xs text-muted-foreground">Último: {c.lastOrderAt ? formatDate(c.lastOrderAt) : 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> LTV</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{formatCurrency(Number(c.ltv ?? 0))}</p>
            <p className="text-xs text-muted-foreground">Ticket médio: {formatCurrency(Number(ltv?.avgTicket ?? c.avgTicket ?? 0))}</p>
          </CardContent>
        </Card>
      </div>

      {/* LTV Breakdown */}
      {ltv && (
        <Card>
          <CardHeader>
            <CardTitle>LTV — Lifetime Value</CardTitle>
            <CardDescription>Análise detalhada do valor vitalício do cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Receita Total</p>
                <p className="text-xl font-bold">{formatCurrency(Number(ltv.totalRevenue ?? 0))}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Ticket Médio</p>
                <p className="text-xl font-bold">{formatCurrency(Number(ltv.avgTicket ?? 0))}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Frequência (meses)</p>
                <p className="text-xl font-bold">{ltv.purchaseFrequency ?? '-'}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Churn Risk</p>
                <p className={`text-xl font-bold ${ltv.churnRisk === 'HIGH' ? 'text-red-600' : ltv.churnRisk === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'}`}>
                  {ltv.churnRisk ?? 'LOW'}
                </p>
              </div>
            </div>

            {/* LTV Projection Bar */}
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Projeção LTV (12 meses)</p>
              <div className="flex items-end gap-1 h-24">
                {Array.from({ length: 12 }, (_, i) => {
                  const val = ltv.monthlyProjection?.[i] ?? (Number(c.ltv ?? 0) / 12) * (i + 1) * 0.1;
                  const maxVal = Math.max(...(ltv.monthlyProjection || [Number(c.ltv ?? 0)]), 1);
                  const pct = (val / maxVal) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary/80 rounded-t"
                        style={{ height: `${Math.max(4, pct)}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground">{i + 1}m</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Dados Cadastrais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 text-sm">
            <div><span className="text-muted-foreground">Documento:</span> {c.document || '-'}</div>
            <div><span className="text-muted-foreground">Tipo:</span> {c.documentType || '-'}</div>
            <div><span className="text-muted-foreground">Criado em:</span> {formatDate(c.createdAt)}</div>
            <div><span className="text-muted-foreground">Atualizado em:</span> {formatDate(c.updatedAt)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
