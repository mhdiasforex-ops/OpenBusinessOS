'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatCurrency } from '@openbusinessos/utils';
import { useState } from 'react';

export default function DREPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: dre, isLoading } = useQuery({
    queryKey: ['dre', month, year],
    queryFn: () => api.get('/financial/dre', { month, year }).then((r: any) => r.data || r),
  });

  const d = dre as any;
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">DRE — Demonstrativo de Resultados</h1>
        <div className="flex items-center gap-2">
          <select
            className="border rounded px-3 py-1 text-sm bg-card"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            className="border rounded px-3 py-1 text-sm bg-card"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p>Carregando DRE...</p>
      ) : d ? (
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader><CardTitle>Resumo — {d.period}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Receita Bruta</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(d.grossRevenue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CMV / Custo</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(d.cogs)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receita Líquida</p>
                  <p className="text-2xl font-bold">{formatCurrency(d.netRevenue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                  <p className={`text-2xl font-bold ${d.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(d.netIncome)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Margins */}
          <Card>
            <CardHeader><CardTitle>Margens</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Margem Bruta</span>
                  <span className="font-medium">{d.grossMargin?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: `${Math.min(100, Math.max(0, d.grossMargin))}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Margem Líquida</span>
                  <span className="font-medium">{d.netMargin?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${Math.min(100, Math.max(0, d.netMargin))}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operating Expenses Detail */}
          <Card>
            <CardHeader><CardTitle>Despesas Operacionais</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Categoria</th>
                    <th className="text-right py-2 px-3">Valor</th>
                    <th className="text-right py-2 px-3">% das Despesas</th>
                  </tr>
                </thead>
                <tbody>
                  {d.operatingExpenses?.map((exp: any) => (
                    <tr key={exp.name} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3">{exp.name}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(exp.value)}</td>
                      <td className="py-2 px-3 text-right">{exp.percentage?.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td className="py-2 px-3">Total</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(d.operatingTotal)}</td>
                    <td className="py-2 px-3 text-right">100%</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* EBITDA */}
          <Card>
            <CardHeader><CardTitle>EBITDA</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(d.ebitda)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                EBITDA = Receita Líquida - Despesas Operacionais
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
      )}
    </div>
  );
}
