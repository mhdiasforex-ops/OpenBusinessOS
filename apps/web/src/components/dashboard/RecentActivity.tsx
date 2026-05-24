'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ShoppingCart,
  CreditCard,
  FileText,
  Clock,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

export type ActivityType = 'order' | 'payment' | 'nfse';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  meta?: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'order',
    description: 'Novo pedido #1847 de Maria Silva',
    timestamp: '2026-05-24T14:32:00',
    meta: 'R$ 1.250,00',
  },
  {
    id: '2',
    type: 'payment',
    description: 'Pagamento recebido de João Santos',
    timestamp: '2026-05-24T13:15:00',
    meta: 'R$ 3.800,00',
  },
  {
    id: '3',
    type: 'nfse',
    description: 'NFS-e #4521 emitida para Tech Solutions',
    timestamp: '2026-05-24T12:48:00',
    meta: 'R$ 7.500,00',
  },
  {
    id: '4',
    type: 'order',
    description: 'Novo pedido #1846 de Ana Costa',
    timestamp: '2026-05-24T11:20:00',
    meta: 'R$ 890,00',
  },
  {
    id: '5',
    type: 'payment',
    description: 'Pagamento recebido de Carlos Oliveira',
    timestamp: '2026-05-24T10:05:00',
    meta: 'R$ 2.100,00',
  },
  {
    id: '6',
    type: 'nfse',
    description: 'NFS-e #4520 emitida para Digital Corp',
    timestamp: '2026-05-24T09:30:00',
    meta: 'R$ 12.000,00',
  },
  {
    id: '7',
    type: 'order',
    description: 'Novo pedido #1845 de Pedro Lima',
    timestamp: '2026-05-23T17:45:00',
    meta: 'R$ 2.340,00',
  },
  {
    id: '8',
    type: 'payment',
    description: 'Pagamento recebido de Fernanda Rocha',
    timestamp: '2026-05-23T16:12:00',
    meta: 'R$ 5.600,00',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const activityConfig: Record<
  ActivityType,
  { icon: React.ElementType; label: string; colorClass: string }
> = {
  order: {
    icon: ShoppingCart,
    label: 'Pedido',
    colorClass:
      'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  },
  payment: {
    icon: CreditCard,
    label: 'Pagamento',
    colorClass:
      'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  },
  nfse: {
    icon: FileText,
    label: 'NFS-e',
    colorClass:
      'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  },
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date('2026-05-24T15:00:00');
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return `${diffDays}d atrás`;
}

// ── Component ──────────────────────────────────────────────────────────────

export function RecentActivity({
  activities = mockActivity,
}: {
  activities?: ActivityItem[];
}) {
  return (
    <Card className="transition-shadow hover:shadow-md dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Atividade Recente
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Últimas ações no sistema
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.colorClass}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight text-foreground">
                    {activity.description}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeTime(activity.timestamp)}</span>
                    {activity.meta && (
                      <>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="font-medium text-foreground/80">
                          {activity.meta}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
