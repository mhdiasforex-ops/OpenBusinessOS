'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Package, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export default function DashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get('/analytics/metrics').then((r) => r.data),
  });

  const cards = [
    { title: 'Receita Mensal', value: metrics?.income ?? 'R$ 0', icon: DollarSign, change: '+12%' },
    { title: 'Clientes Ativos', value: metrics?.activeCustomers ?? '0', icon: Users, change: '+5%' },
    { title: 'Produtos', value: metrics?.totalProducts ?? '0', icon: Package, change: '+2' },
    { title: 'Margem Média', value: metrics?.averageMargin ?? '0%', icon: TrendingUp, change: '+1.5%' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Painel de Controle</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.change} em relação ao mês anterior</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {isLoading && <p className="text-muted-foreground">Carregando métricas...</p>}
    </div>
  );
}
