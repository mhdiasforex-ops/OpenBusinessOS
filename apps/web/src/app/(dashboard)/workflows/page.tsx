'use client';


import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Zap, Plus, Trash2, Play, Pencil, GripVertical } from 'lucide-react';
import Link from 'next/link';

const triggerLabels: Record<string, string> = {
  ORDER_CREATED: 'Pedido Criado',
  PAYMENT_RECEIVED: 'Pagamento Recebido',
  CUSTOMER_CREATED: 'Cliente Criado',
  INVOICE_OVERDUE: 'Fatura Vencida',
  STOCK_LOW: 'Estoque Baixo',
  MANUAL: 'Manual',
  TRANSACTION_CREATED: 'Transação Criada',
  TRANSACTION_PAID: 'Transação Paga',
  PAYMENT_OVERDUE: 'Pagamento em Atraso',
  CUSTOMER_CHURN_RISK: 'Risco de Churn',
  ONBOARDING_COMPLETED: 'Onboarding Concluído',
  CAMPAIGN_SENT: 'Campanha Enviada',
  WORKFLOW_TRIGGERED: 'Workflow Disparado',
  WORKFLOW_COMPLETED: 'Workflow Concluído',
};

const stepTypeLabels: Record<string, string> = {
  SEND_EMAIL: '📧 Email',
  SEND_WHATSAPP: '📱 WhatsApp',
  CREATE_TASK: '📋 Tarefa',
  UPDATE_STATUS: '🔄 Status',
  WEBHOOK: '🔗 Webhook',
  AI_ACTION: '🤖 IA',
  DELAY: '⏱️ Aguardar',
  CONDITION: '🔀 Condição',
};

const STEP_TYPES = [
  { value: 'SEND_EMAIL', label: '📧 Enviar Email' },
  { value: 'SEND_WHATSAPP', label: '📱 Enviar WhatsApp' },
  { value: 'CREATE_TASK', label: '📋 Criar Tarefa' },
  { value: 'UPDATE_STATUS', label: '🔄 Atualizar Status' },
  { value: 'WEBHOOK', label: '🔗 Webhook' },
  { value: 'AI_ACTION', label: '🤖 Ação com IA' },
  { value: 'DELAY', label: '⏳ Espera' },
  { value: 'CONDITION', label: '🔀 Condição' },
];

// Inline step config editor
function StepConfigEditor({ step, index, onUpdate }: { step: any; index: number; onUpdate: (i: number, config: any) => void }) {
  const config = step.config || {};

  const setField = (field: string, value: any) => {
    onUpdate(index, { ...config, [field]: value });
  };

  switch (step.type) {
    case 'SEND_EMAIL':
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Destinatário</Label>
            <Input value={config.to || ''} onChange={(e) => setField('to', e.target.value)} placeholder="owner ou email" />
          </div>
          <div>
            <Label>Assunto</Label>
            <Input value={config.subject || ''} onChange={(e) => setField('subject', e.target.value)} placeholder="Assunto do email" />
          </div>
          <div className="md:col-span-2">
            <Label>Template</Label>
            <Input value={config.template || ''} onChange={(e) => setField('template', e.target.value)} placeholder="welcome, follow-up, overdue..." />
          </div>
        </div>
      );
    case 'SEND_WHATSAPP':
      return (
        <div>
          <Label>Mensagem</Label>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm bg-card min-h-[80px]"
            value={config.message || ''}
            onChange={(e) => setField('message', e.target.value)}
            placeholder="Texto da mensagem"
          />
        </div>
      );
    case 'CREATE_TASK':
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Título da Tarefa</Label>
            <Input value={config.title || ''} onChange={(e) => setField('title', e.target.value)} placeholder="Ex: Entrar em contato com cliente" />
          </div>
          <div>
            <Label>Prioridade</Label>
            <select className="w-full border rounded px-3 py-2 text-sm bg-card" value={config.priority || 'MEDIUM'} onChange={(e) => setField('priority', e.target.value)}>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
            </select>
          </div>
        </div>
      );
    case 'UPDATE_STATUS':
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Entidade</Label>
            <select className="w-full border rounded px-3 py-2 text-sm bg-card" value={config.entity || 'TRANSACTION'} onChange={(e) => setField('entity', e.target.value)}>
              <option value="TRANSACTION">Transação</option>
              <option value="CUSTOMER">Cliente</option>
              <option value="ORDER">Pedido</option>
              <option value="PRODUCT">Produto</option>
            </select>
          </div>
          <div>
            <Label>Novo Status</Label>
            <Input value={config.newStatus || ''} onChange={(e) => setField('newStatus', e.target.value)} placeholder="PAID, ACTIVE, CANCELLED..." />
          </div>
        </div>
      );
    case 'WEBHOOK':
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>URL</Label>
            <Input value={config.url || ''} onChange={(e) => setField('url', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Método</Label>
            <select className="w-full border rounded px-3 py-2 text-sm bg-card" value={config.method || 'POST'} onChange={(e) => setField('method', e.target.value)}>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
        </div>
      );
    case 'AI_ACTION':
      return (
        <div>
          <Label>Prompt para IA</Label>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm bg-card min-h-[80px]"
            value={config.prompt || ''}
            onChange={(e) => setField('prompt', e.target.value)}
            placeholder="Descreva o que a IA deve fazer..."
          />
        </div>
      );
    case 'DELAY':
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Duração</Label>
            <Input type="number" value={config.seconds || 60} onChange={(e) => setField('seconds', Number(e.target.value))} />
          </div>
          <div className="flex items-end">
            <span className="text-sm text-muted-foreground pb-2">segundos</span>
          </div>
        </div>
      );
    case 'CONDITION':
      return (
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Campo</Label>
            <Input value={config.field || ''} onChange={(e) => setField('field', e.target.value)} placeholder="amount, status..." />
          </div>
          <div>
            <Label>Operador</Label>
            <select className="w-full border rounded px-3 py-2 text-sm bg-card" value={config.operator || 'equals'} onChange={(e) => setField('operator', e.target.value)}>
              <option value="equals">Igual a</option>
              <option value="not_equals">Diferente de</option>
              <option value="greater_than">Maior que</option>
              <option value="less_than">Menor que</option>
              <option value="contains">Contém</option>
            </select>
          </div>
          <div>
            <Label>Valor</Label>
            <Input value={config.value || ''} onChange={(e) => setField('value', e.target.value)} placeholder="Valor de comparação" />
          </div>
        </div>
      );
    default:
      return (
        <div>
          <Label>Config JSON</Label>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm bg-card font-mono min-h-[60px]"
            value={JSON.stringify(config, null, 2)}
            onChange={(e) => {
              try { onUpdate(index, JSON.parse(e.target.value)); } catch { /* invalid json — ignore */ }
            }}
          />
        </div>
      );
  }
}

export default function WorkflowsPage() {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSteps, setEditSteps] = useState<any[]>([]);

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.get('/workflows'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/workflows/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/workflows/${id}`),
    onMutate: (id) => setDeleting(id),
    onSettled: () => setDeleting(null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/workflows/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setEditingId(null);
    },
  });

  const items: any[] = workflows?.data || workflows || [];
  const activeCount = items.filter((w: any) => w.isActive).length;
  const inactiveCount = items.length - activeCount;

  const startEdit = (wf: any) => {
    setEditingId(wf.id);
    setEditName(wf.name);
    setEditSteps((wf.steps || []).map((s: any) => ({ ...s })));
  };

  const addEditStep = () => {
    setEditSteps([...editSteps, { type: 'SEND_EMAIL', order: editSteps.length + 1, config: {} }]);
  };

  const updateEditStep = (index: number, field: string, value: any) => {
    const next = [...editSteps];
    next[index] = { ...next[index], [field]: value };
    setEditSteps(next);
  };

  const updateEditStepConfig = (index: number, config: any) => {
    const next = [...editSteps];
    next[index] = { ...next[index], config };
    setEditSteps(next);
  };

  const removeEditStep = (index: number) => {
    setEditSteps(editSteps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const saveEdit = (id: string) => {
    updateMutation.mutate({
      id,
      data: {
        name: editName,
        steps: editSteps.map((s, i) => ({ order: i + 1, type: s.type, config: s.config, fallback: s.fallback })),
      },
    });
  };

  const kpis = [
    { title: 'Total Workflows', value: items.length, icon: Zap },
    { title: 'Ativos', value: activeCount, icon: Play },
    { title: 'Inativos', value: inactiveCount, icon: Zap },
    { title: 'Total de Passos', value: items.reduce((sum: number, w: any) => sum + (w.steps?.length || 0), 0), icon: Play },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Automações</h1>
        <Link href="/workflows/novo">
          <Button><Plus className="h-4 w-4 mr-2" />Novo Workflow</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma automação configurada</p>
            <p className="text-sm text-muted-foreground mb-4">Crie seu primeiro workflow para automatizar tarefas repetitivas</p>
            <Link href="/workflows/novo"><Button><Plus className="h-4 w-4 mr-2" />Criar Workflow</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((wf: any) => {
            const isEditing = editingId === wf.id;
            return (
              <Card key={wf.id} className={!wf.isActive && !isEditing ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {isEditing ? (
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-lg font-bold" />
                      ) : (
                        <CardTitle className="text-lg">{wf.name}</CardTitle>
                      )}
                      <CardDescription className="mt-1">
                        Gatilho: <Badge variant="outline">{triggerLabels[wf.trigger] || wf.trigger}</Badge>
                      </CardDescription>
                    </div>
                    <Switch
                      checked={wf.isActive}
                      onCheckedChange={(checked: boolean) => toggleMutation.mutate({ id: wf.id, isActive: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isEditing ? (
                    <>
                      {/* Edit mode: step editor */}
                      <div className="space-y-3">
                        {editSteps.map((step, index) => (
                          <div key={index} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Passo {index + 1}</span>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => removeEditStep(index)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div>
                              <Label>Tipo de Ação</Label>
                              <select
                                className="w-full border rounded px-3 py-2 text-sm bg-card"
                                value={step.type}
                                onChange={(e) => updateEditStep(index, 'type', e.target.value)}
                              >
                                {STEP_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                            </div>
                            <StepConfigEditor step={step} index={index} onUpdate={updateEditStepConfig} />
                          </div>
                        ))}
                      </div>
                      <Button size="sm" variant="outline" onClick={addEditStep} className="w-full gap-2">
                        <Plus className="h-4 w-4" /> Adicionar Passo
                      </Button>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                        <Button size="sm" onClick={() => saveEdit(wf.id)} disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* View mode */}
                      <div className="text-sm text-muted-foreground">
                        {(wf.steps || []).length} passo(s)
                      </div>
                      {wf.steps && wf.steps.length > 0 && (
                        <div className="space-y-1">
                          {wf.steps.sort((a: any, b: any) => a.order - b.order).map((step: any) => (
                            <div key={step.id} className="flex items-center gap-2 text-sm bg-muted/50 rounded px-2 py-1">
                              <span className="text-xs text-muted-foreground">{step.order}.</span>
                              <span>{stepTypeLabels[step.type] || step.type}</span>
                              {step.type === 'UPDATE_STATUS' && step.config?.newStatus && (
                                <Badge variant="outline" className="text-xs ml-auto">{step.config.newStatus}</Badge>
                              )}
                              {step.type === 'CONDITION' && step.config?.field && (
                                <span className="text-xs text-muted-foreground ml-auto">{step.config.field} {step.config.operator} {step.config.value}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(wf)}
                          className="gap-1"
                        >
                          <Pencil className="h-3 w-3" /> Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => { if (confirm('Excluir este workflow?')) deleteMutation.mutate(wf.id); }}
                          disabled={deleting === wf.id}
                        >
                          {deleting === wf.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
