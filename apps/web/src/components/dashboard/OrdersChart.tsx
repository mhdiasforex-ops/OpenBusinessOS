'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ── Types ──────────────────────────────────────────────────────────────────

export interface OrdersDataPoint {
  month: string;
  orders: number;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const mockOrdersData: OrdersDataPoint[] = [
  { month: 'Jun/25', orders: 42 },
  { month: 'Jul/25', orders: 55 },
  { month: 'Ago/25', orders: 48 },
  { month: 'Set/25', orders: 62 },
  { month: 'Out/25', orders: 70 },
  { month: 'Nov/25', orders: 65 },
  { month: 'Dez/25', orders: 78 },
  { month: 'Jan/26', orders: 72 },
  { month: 'Fev/26', orders: 85 },
  { month: 'Mar/26', orders: 91 },
  { month: 'Abr/26', orders: 98 },
  { month: 'Mai/26', orders: 84 },
];

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
        {payload[0].value} pedidos
      </p>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function OrdersChart({
  data = mockOrdersData,
}: {
  data?: OrdersDataPoint[];
}) {
  return (
    <Card className="transition-shadow hover:shadow-md dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Pedidos por Mês
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Últimos 12 meses
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
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
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="orders"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
