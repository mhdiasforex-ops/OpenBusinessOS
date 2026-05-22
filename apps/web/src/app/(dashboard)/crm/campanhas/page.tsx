'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useState } from 'react';

export default function CampanhasPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    channel: 'EMAIL',
    segment: 'ALL',
    recipientCount: 0,
    message: '',
  });

  const createCampaign = useMutation({
    mutationFn: () => api.post('/crm/campaigns', form),
    onSuccess: () => {
      setShowForm(false);
      setForm({ name: '', channel: 'EMAIL', segment: 'ALL', recipientCount: 0, message: '' });
    },
  });

  const channels = [
    { value: 'EMAIL', label: '📧 Email' },
    { value: 'WHATSAPP', label: '📱 WhatsApp' },
    { value: 'SMS', label: '💬 SMS' },
  ];

  const segments = [
    { value: 'ALL', label: 'Todos' },
    { value: 'VIP', label: '⭐ VIP' },
    { value: 'REGULAR', label: '👤 Regulares' },
    { value: 'AT_RISK', label: '⚠️ Risco de Churn' },
    { value: 'NEW', label: '🆕 Novos' },
    { value: 'CHURNED', label: '❌ Churned' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campanhas</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nova Campanha'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Campanha</CardTitle>
            <CardDescription>Envie mensagens para segmentos específicos de clientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Nome da Campanha</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Black Friday 2026"
                />
              </div>
              <div>
                <Label>Canal</Label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm bg-card"
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                >
                  {channels.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Segmento</Label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm bg-card"
                  value={form.segment}
                  onChange={(e) => setForm({ ...form, segment: e.target.value })}
                >
                  {segments.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Qtd. Destinatários (estimativa)</Label>
                <Input
                  type="number"
                  value={form.recipientCount}
                  onChange={(e) => setForm({ ...form, recipientCount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Mensagem</Label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm bg-card min-h-[100px]"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Conteúdo da mensagem..."
              />
            </div>
            <Button
              onClick={() => createCampaign.mutate()}
              disabled={!form.name || !form.message}
              className="w-full md:w-auto"
            >
              Enviar Campanha
            </Button>
          </CardContent>
        </Card>
      )}

      {!showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Campanhas Enviadas</CardTitle>
            <CardDescription>No MVP, as campanhas são registradas como eventos no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              As campanhas criadas disparam eventos no EventBus que podem ser consumidos por
              integrações de email (SendGrid, Mailgun), WhatsApp (Z-API, Evolution API) ou SMS.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Use o módulo de Workflows para configurar automações baseadas em campanhas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
