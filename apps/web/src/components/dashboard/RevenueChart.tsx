'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ── Types ──────────────────────────────────────────────────────────────────

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const mockRevenueData: RevenueDataPoint[] = [
  { month: 'Jun/25', revenue: 42000 },
  { month: 'Jul/25', revenue: 48000 },
  { month: 'Ago/25', revenue: 45000 },
  { month: 'Set/25', revenue: 52000 },
  { month: 'Out/25', revenue: 61000 },
  { month: 'Nov/25', revenue: 58000 },
  { month: 'Dez/25', revenue: 73000 },
  { month: 'Jan/26', revenue: 69000 },
  { month: 'Fev/26', revenue: 81000 },
  { month: 'Mar/26', revenue: 95000 },
  { month: 'Abr/26', revenue: 110000 },
  { month: 'Mai/26', revenue: 127450 },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md dark:border-gray-700 dark:bg-gray-900">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function RevenueChart({
  data = mockRevenueData,
}: {
  data?: RevenueDataPoint[];
}) {
  return (
    <Card className="transition-shadow hover:shadow-md dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Receita Mensal
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Últimos 12 meses
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted/40"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value: number) =>
                  `${(value / 1000).toFixed(0)}k`
                }
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
