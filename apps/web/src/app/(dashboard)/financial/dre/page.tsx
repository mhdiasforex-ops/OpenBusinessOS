'use client';


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatCurrency } from '@openbusinessos/utils';
import { useState, useCallback, useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────────────

interface OperatingExpense {
  name: string;
  value: number;
  percentage: number;
}

interface DREResult {
  period: string;
  grossRevenue: number;
  cogs: number;
  netRevenue: number;
  grossMargin: number;
  operatingExpenses: OperatingExpense[];
  operatingTotal: number;
  ebitda: number;
  netIncome: number;
  netMargin: number;
}

// ── Constants ──────────────────────────────────────────────────────

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MESES_CURTOS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const ANOS = [2023, 2024, 2025, 2026, 2027];

// ── Helpers ────────────────────────────────────────────────────────

function calcDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-xs text-muted-foreground">—</span>;
  const isPositive = delta >= 0;
  const arrow = isPositive ? '▲' : '▼';
  const color = isPositive ? 'text-emerald-600' : 'text-red-600';
  return (
    <span className={`text-xs font-medium ${color}`}>
      {arrow} {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

function pctOverRevenue(value: number, revenue: number): string {
  if (!revenue) return '—';
  return ((value / revenue) * 100).toFixed(1) + '%';
}

// ── CSV Export ──────────────────────────────────────────────────────

function exportToCSV(dre: DREResult) {
  const rows: string[][] = [];
  rows.push(['DRE — Demonstrativo de Resultado do Exercício']);
  rows.push(['Período', dre.period]);
  rows.push([]);
  rows.push(['Descrição', 'Valor (R$)', '% Receita Bruta']);

  rows.push(['Receita Bruta', dre.grossRevenue.toFixed(2), '100.0%']);
  rows.push(['(-) CMV', (-dre.cogs).toFixed(2), pctOverRevenue(-dre.cogs, dre.grossRevenue)]);
  rows.push(['(=) Receita Líquida', dre.netRevenue.toFixed(2), pctOverRevenue(dre.netRevenue, dre.grossRevenue)]);
  rows.push([]);

  rows.push(['(-) Despesas Operacionais', (-dre.operatingTotal).toFixed(2), pctOverRevenue(-dre.operatingTotal, dre.grossRevenue)]);
  for (const exp of dre.operatingExpenses) {
    rows.push([`    ${exp.name}`, (-exp.value).toFixed(2), `${exp.percentage.toFixed(1)}%`]);
  }
  rows.push([]);

  rows.push(['(=) EBITDA', dre.ebitda.toFixed(2), pctOverRevenue(dre.ebitda, dre.grossRevenue)]);
  rows.push(['(=) Lucro Líquido', dre.netIncome.toFixed(2), pctOverRevenue(dre.netIncome, dre.grossRevenue)]);
  rows.push([]);
  rows.push(['Margem Bruta', `${dre.grossMargin.toFixed(1)}%`]);
  rows.push(['Margem Líquida', `${dre.netMargin.toFixed(1)}%`]);

  const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dre_${dre.period.replace('/', '-')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Page Component ─────────────────────────────────────────────────

export default function DREPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // ── Period navigation ──────────────────────────────────────────

  const goToPrevMonth = useCallback(() => {
    setMonth((m) => {
      const newMonth = m === 1 ? 12 : m - 1;
      if (m === 1) setYear((y) => y - 1);
      return newMonth;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setMonth((m) => {
      const newMonth = m === 12 ? 1 : m + 1;
      if (m === 12) setYear((y) => y + 1);
      return newMonth;
    });
  }, []);

  // ── Queries ────────────────────────────────────────────────────

  const { data: dre, isLoading: dreLoading } = useQuery<DREResult>({
    queryKey: ['dre', month, year],
    queryFn: () => api.get('/financial/dre', { month, year }),
  });

  const { data: comparison } = useQuery<DREResult[]>({
    queryKey: ['dre-comparison', 3],
    queryFn: () => api.get('/financial/dre/comparison', { months: 3 }),
  });

  // ── Previous month data ────────────────────────────────────────

  const prevMonthData = useMemo<DREResult | null>(() => {
    if (!comparison || !Array.isArray(comparison) || comparison.length < 2) return null;
    // Find the entry that matches the previous period
    const currentPeriod = `${String(month).padStart(2, '0')}/${year}`;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevPeriod = `${String(prevMonth).padStart(2, '0')}/${prevYear}`;
    return comparison.find((c) => c.period === prevPeriod) ?? null;
  }, [comparison, month, year]);

  // ── Delta calculations ─────────────────────────────────────────

  const deltas = useMemo(() => {
    if (!dre || !prevMonthData) return null;
    return {
      grossRevenue: calcDelta(dre.grossRevenue, prevMonthData.grossRevenue),
      cogs: calcDelta(dre.cogs, prevMonthData.cogs),
      netRevenue: calcDelta(dre.netRevenue, prevMonthData.netRevenue),
      grossMargin: calcDelta(dre.grossMargin, prevMonthData.grossMargin),
      operatingTotal: calcDelta(dre.operatingTotal, prevMonthData.operatingTotal),
      ebitda: calcDelta(dre.ebitda, prevMonthData.ebitda),
      netIncome: calcDelta(dre.netIncome, prevMonthData.netIncome),
      netMargin: calcDelta(dre.netMargin, prevMonthData.netMargin),
    };
  }, [dre, prevMonthData]);

  // ── Month/Year options ─────────────────────────────────────────

  const monthOptions = MESES_CURTOS.map((m, i) => ({
    value: String(i + 1),
    label: m,
  }));

  const yearOptions = ANOS.map((y) => ({
    value: String(y),
    label: String(y),
  }));

  const periodLabel = `${MESES[month - 1]} ${year}`;

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">DRE — Demonstrativo de Resultados</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevMonth}>
            ◀ Anterior
          </Button>
          <Select
            className="w-[100px]"
            options={monthOptions}
            value={String(month)}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
          <Select
            className="w-[90px]"
            options={yearOptions}
            value={String(year)}
            onChange={(e) => setYear(Number(e.target.value))}
          />
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            Próximo ▶
          </Button>
          {dre && (
            <Button variant="outline" size="sm" onClick={() => exportToCSV(dre)}>
              📥 Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {/* ── Loading state ───────────────────────────────────────── */}
      {dreLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Carregando DRE...
          </CardContent>
        </Card>
      ) : !dre ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum dado disponível para o período selecionado.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── KPI Cards ──────────────────────────────────────── */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita Bruta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(dre.grossRevenue)}
                </p>
                {deltas && <DeltaBadge delta={deltas.grossRevenue} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  CMV
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(dre.cogs)}
                </p>
                {deltas && <DeltaBadge delta={deltas.cogs} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita Líquida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(dre.netRevenue)}
                </p>
                {deltas && <DeltaBadge delta={deltas.netRevenue} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Margem Bruta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600">
                  {dre.grossMargin.toFixed(1)}%
                </p>
                {deltas && <DeltaBadge delta={deltas.grossMargin} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Despesas Operacionais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(dre.operatingTotal)}
                </p>
                {deltas && <DeltaBadge delta={deltas.operatingTotal} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  EBITDA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${dre.ebitda >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(dre.ebitda)}
                </p>
                {deltas && <DeltaBadge delta={deltas.ebitda} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lucro Líquido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${dre.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(dre.netIncome)}
                </p>
                {deltas && <DeltaBadge delta={deltas.netIncome} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Margem Líquida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${dre.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {dre.netMargin.toFixed(1)}%
                </p>
                {deltas && <DeltaBadge delta={deltas.netMargin} />}
              </CardContent>
            </Card>
          </div>

          {/* ── Tabs: Tabela / Comparativo ─────────────────────── */}
          <Tabs defaultValue="tabela">
            <TabsList>
              <TabsTrigger value="tabela">Tabela DRE</TabsTrigger>
              <TabsTrigger value="comparativo">Comparativo Mensal</TabsTrigger>
            </TabsList>

            {/* ── Tab: DRE Table ──────────────────────────────── */}
            <TabsContent value="tabela">
              <Card>
                <CardHeader>
                  <CardTitle>DRE — {periodLabel}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50%]">Descrição</TableHead>
                        <TableHead className="text-right">Valor (R$)</TableHead>
                        <TableHead className="text-right">% Receita Bruta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Receita Bruta */}
                      <TableRow className="bg-muted/30 font-semibold">
                        <TableCell>Receita Bruta</TableCell>
                        <TableCell className="text-right text-green-700">
                          {formatCurrency(dre.grossRevenue)}
                        </TableCell>
                        <TableCell className="text-right">100,0%</TableCell>
                      </TableRow>

                      {/* CMV */}
                      <TableRow>
                        <TableCell className="pl-8 text-red-700">(-) CMV</TableCell>
                        <TableCell className="text-right text-red-700">
                          {formatCurrency(-dre.cogs)}
                        </TableCell>
                        <TableCell className="text-right">
                          {pctOverRevenue(-dre.cogs, dre.grossRevenue)}
                        </TableCell>
                      </TableRow>

                      {/* Receita Líquida */}
                      <TableRow className="bg-muted/30 font-semibold border-t-2 border-t-foreground/10">
                        <TableCell>(=) Receita Líquida</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dre.netRevenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {pctOverRevenue(dre.netRevenue, dre.grossRevenue)}
                        </TableCell>
                      </TableRow>

                      {/* Despesas Operacionais — header */}
                      <TableRow className="font-semibold">
                        <TableCell className="text-red-700">(-) Despesas Operacionais</TableCell>
                        <TableCell className="text-right text-red-700">
                          {formatCurrency(-dre.operatingTotal)}
                        </TableCell>
                        <TableCell className="text-right">
                          {pctOverRevenue(-dre.operatingTotal, dre.grossRevenue)}
                        </TableCell>
                      </TableRow>

                      {/* Despesas Operacionais — items */}
                      {dre.operatingExpenses?.map((exp) => (
                        <TableRow key={exp.name}>
                          <TableCell className="pl-12 text-muted-foreground">
                            {exp.name}
                            <Badge variant="secondary" className="ml-2 text-[10px]">
                              {exp.percentage.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(-exp.value)}
                          </TableCell>
                          <TableCell className="text-right">
                            {pctOverRevenue(-exp.value, dre.grossRevenue)}
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* EBITDA */}
                      <TableRow className="bg-muted/30 font-semibold border-t-2 border-t-foreground/10">
                        <TableCell>(=) EBITDA</TableCell>
                        <TableCell className={`text-right ${dre.ebitda >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                          {formatCurrency(dre.ebitda)}
                        </TableCell>
                        <TableCell className="text-right">
                          {pctOverRevenue(dre.ebitda, dre.grossRevenue)}
                        </TableCell>
                      </TableRow>

                      {/* Lucro Líquido */}
                      <TableRow className="bg-muted/30 font-semibold border-t-2 border-t-foreground/10">
                        <TableCell>(=) Lucro Líquido</TableCell>
                        <TableCell className={`text-right ${dre.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatCurrency(dre.netIncome)}
                        </TableCell>
                        <TableCell className="text-right">
                          {pctOverRevenue(dre.netIncome, dre.grossRevenue)}
                        </TableCell>
                      </TableRow>

                      {/* Margem Bruta */}
                      <TableRow className="border-t-2 border-t-foreground/10">
                        <TableCell className="text-muted-foreground">Margem Bruta</TableCell>
                        <TableCell className="text-right font-medium text-emerald-700">
                          {dre.grossMargin.toFixed(1)}%
                        </TableCell>
                        <TableCell />
                      </TableRow>

                      {/* Margem Líquida */}
                      <TableRow>
                        <TableCell className="text-muted-foreground">Margem Líquida</TableCell>
                        <TableCell className={`text-right font-medium ${dre.netMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {dre.netMargin.toFixed(1)}%
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Monthly Comparison ─────────────────────── */}
            <TabsContent value="comparativo">
              <Card>
                <CardHeader>
                  <CardTitle>Comparativo Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  {!comparison || !Array.isArray(comparison) || comparison.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      Nenhum dado comparativo disponível.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">Indicador</TableHead>
                          {comparison.map((c) => (
                            <TableHead key={c.period} className="text-right">
                              {c.period}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="font-semibold">
                          <TableCell>Receita Bruta</TableCell>
                          {comparison.map((c) => (
                            <TableCell key={c.period} className="text-right text-green-700">
                              {formatCurrency(c.grossRevenue)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8 text-red-700">(-) CMV</TableCell>
                          {comparison.map((c) => (
                            <TableCell key={c.period} className="text-right text-red-700">
                              {formatCurrency(-c.cogs)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="bg-muted/30 font-semibold">
                          <TableCell>(=) Receita Líquida</TableCell>
                          {comparison.map((c) => (
                            <TableCell key={c.period} className="text-right">
                              {formatCurrency(c.netRevenue)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-red-700">(-) Despesas Operacionais</TableCell>
                          {comparison.map((c) => (
                            <TableCell key={c.period} className="text-right text-red-700">
                              {formatCurrency(-c.operatingTotal)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="bg-muted/30 font-semibold">
                          <TableCell>(=) EBITDA</TableCell>
                          {comparison.map((c) => (
                            <TableCell key={c.period} className="text-right">
                              {formatCurrency(c.ebitda)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="bg-muted/30 font-semibold border-t-2 border-t-foreground/10">
                          <TableCell>(=) Lucro Líquido</TableCell>
                          {comparison.map((c) => (
                            <TableCell key={c.period} className="text-right">
                              {formatCurrency(c.netIncome)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">Margem Bruta</TableCell>
                          {comparison.map((c) => (
                            <TableCell key={c.period} className="text-right text-emerald-700">
                              {c.grossMargin.toFixed(1)}%
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">Margem Líquida</TableCell>
                          {comparison.map((c) => (
                            <TableCell key={c.period} className="text-right">
                              {c.netMargin.toFixed(1)}%
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
