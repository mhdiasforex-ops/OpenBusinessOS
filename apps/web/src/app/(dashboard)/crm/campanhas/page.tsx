'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatCurrency } from '@openbusinessos/utils';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Megaphone, Send, TrendingUp, DollarSign, Plus, Users, RefreshCw, Loader2 } from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────

const STORAGE_KEY = 'businessos:campaigns';

const CHANNEL_OPTIONS = [
  { value: 'EMAIL', label: '📧 Email' },
  { value: 'WHATSAPP', label: '📱 WhatsApp' },
  { value: 'SMS', label: '💬 SMS' },
];

const SEGMENT_OPTIONS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'VIP', label: '⭐ VIP' },
  { value: 'REGULAR', label: '👤 Regulares' },
  { value: 'NEW', label: '🆕 Novos' },
  { value: 'AT_RISK', label: '⚠️ Risco de Churn' },
  { value: 'CHURNED', label: '❌ Churned' },
];

const channelLabel: Record<string, string> = {
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
};

const channelVariant: Record<string, 'default' | 'secondary' | 'outline' | 'info'> = {
  EMAIL: 'info',
  WHATSAPP: 'default',
  SMS: 'secondary',
};

const segmentLabel: Record<string, string> = {
  ALL: 'Todos',
  VIP: 'VIP',
  REGULAR: 'Regular',
  NEW: 'Novo',
  AT_RISK: 'Em Risco',
  CHURNED: 'Churned',
};

const segmentBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'> = {
  ALL: 'outline',
  VIP: 'default',
  REGULAR: 'info',
  NEW: 'success',
  AT_RISK: 'warning',
  CHURNED: 'destructive',
};

const statusLabel: Record<string, string> = {
  SENT: 'Enviada',
  PENDING: 'Pendente',
  FAILED: 'Falhou',
};

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  SENT: 'success',
  PENDING: 'warning',
  FAILED: 'destructive',
};

// ── Types ────────────────────────────────────────────────────────

interface CampaignRecord {
  id: string;
  name: string;
  channel: string;
  segment: string;
  recipientCount: number;
  status: 'SENT' | 'PENDING' | 'FAILED';
  message: string;
  date: string;
}

interface CampaignFormState {
  name: string;
  channel: string;
  segment: string;
  recipientCount: number;
  message: string;
}

const emptyForm: CampaignFormState = {
  name: '',
  channel: 'EMAIL',
  segment: 'ALL',
  recipientCount: 0,
  message: '',
};

// ── localStorage helpers ─────────────────────────────────────────

function loadCampaigns(): CampaignRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCampaigns(campaigns: CampaignRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
}

// ── Page component ───────────────────────────────────────────────

export default function CampanhasPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [form, setForm] = useState<CampaignFormState>({ ...emptyForm });

  // Load from localStorage on mount
  useEffect(() => {
    setCampaigns(loadCampaigns());
  }, []);

  const persistCampaigns = useCallback((updated: CampaignRecord[]) => {
    setCampaigns(updated);
    saveCampaigns(updated);
  }, []);

  // ── Mutations ────────────────────────────────────────────────

  const createCampaign = useMutation({
    mutationFn: (data: CampaignFormState) => api.post('/crm/campaigns', data),
    onSuccess: (_data, variables) => {
      const newCampaign: CampaignRecord = {
        id: crypto.randomUUID(),
        name: variables.name,
        channel: variables.channel,
        segment: variables.segment,
        recipientCount: variables.recipientCount,
        status: 'SENT',
        message: variables.message,
        date: new Date().toISOString(),
      };
      const updated = [newCampaign, ...campaigns];
      persistCampaigns(updated);
      setDialogOpen(false);
      setForm({ ...emptyForm });
    },
    onError: (_error, variables) => {
      // Even on API error, record as PENDING in localStorage for MVP
      const newCampaign: CampaignRecord = {
        id: crypto.randomUUID(),
        name: variables.name,
        channel: variables.channel,
        segment: variables.segment,
        recipientCount: variables.recipientCount,
        status: 'PENDING',
        message: variables.message,
        date: new Date().toISOString(),
      };
      const updated = [newCampaign, ...campaigns];
      persistCampaigns(updated);
      setDialogOpen(false);
      setForm({ ...emptyForm });
    },
  });

  const segmentMutation = useMutation({
    mutationFn: () => api.post('/crm/segment'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  // ── KPI computation ──────────────────────────────────────────

  const kpis = useMemo(() => {
    const total = campaigns.length;
    const enviadas = campaigns.filter((c) => c.status === 'SENT').length;
    const taxaConversao = total > 0 ? ((enviadas / total) * 100) : 0;
    // ROI Estimado: rough estimate based on sent campaigns * avg recipients * R$2.50 per contact
    const totalRecipientsEnviados = campaigns
      .filter((c) => c.status === 'SENT')
      .reduce((sum, c) => sum + c.recipientCount, 0);
    const roiEstimado = totalRecipientsEnviados * 2.5;
    return { total, enviadas, taxaConversao, roiEstimado };
  }, [campaigns]);

  // ── Handlers ─────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;
    createCampaign.mutate(form);
  };

  const handleOpenDialog = () => {
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campanhas</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => segmentMutation.mutate()}
            disabled={segmentMutation.isPending}
          >
            {segmentMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Segmentar Clientes
          </Button>
          <Button onClick={handleOpenDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Campanhas
            </CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.total}</p>
            <p className="text-xs text-muted-foreground">campanhas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Enviadas
            </CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{kpis.enviadas}</p>
            <p className="text-xs text-muted-foreground">campanhas entregues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.taxaConversao.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">enviadas vs total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ROI Estimado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(kpis.roiEstimado)}
            </p>
            <p className="text-xs text-muted-foreground">retorno estimado</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Campaign History Table ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Campanhas</CardTitle>
          <CardDescription>
            Registro de todas as campanhas criadas. No MVP, os dados são armazenados localmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhuma campanha registrada ainda.</p>
              <p className="text-sm mt-1">
                Clique em &quot;Nova Campanha&quot; para criar sua primeira campanha.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead className="text-right">Destinatários</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant={channelVariant[c.channel] || 'outline'}>
                        {channelLabel[c.channel] || c.channel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={segmentBadgeVariant[c.segment] || 'outline'}>
                        {segmentLabel[c.segment] || c.segment}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {c.recipientCount.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[c.status] || 'secondary'}>
                        {statusLabel[c.status] || c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(c.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── New Campaign Dialog ────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Campanha</DialogTitle>
            <DialogDescription>
              Envie mensagens para segmentos específicos de clientes
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="camp-name">Nome da Campanha</Label>
              <Input
                id="camp-name"
                placeholder="Ex: Black Friday 2026"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="camp-channel">Canal</Label>
                <Select
                  id="camp-channel"
                  options={CHANNEL_OPTIONS}
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-segment">Segmento</Label>
                <Select
                  id="camp-segment"
                  options={SEGMENT_OPTIONS}
                  value={form.segment}
                  onChange={(e) => setForm({ ...form, segment: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="camp-recipients">Qtd. Destinatários (estimativa)</Label>
              <Input
                id="camp-recipients"
                type="number"
                min="0"
                placeholder="0"
                value={form.recipientCount || ''}
                onChange={(e) =>
                  setForm({ ...form, recipientCount: Number(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="camp-message">Mensagem</Label>
              <Textarea
                id="camp-message"
                placeholder="Conteúdo da mensagem..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="min-h-[120px]"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!form.name.trim() || !form.message.trim() || createCampaign.isPending}
              >
                {createCampaign.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Campanha
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
