'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Trash2, Plus } from 'lucide-react';

const TRIGGERS = [
  { value: 'TRANSACTION_CREATED', label: 'Transação Criada' },
  { value: 'TRANSACTION_PAID', label: 'Transação Paga' },
  { value: 'PAYMENT_OVERDUE', label: 'Pagamento em Atraso' },
  { value: 'STOCK_LOW', label: 'Estoque Baixo' },
  { value: 'CUSTOMER_CREATED', label: 'Cliente Criado' },
  { value: 'CUSTOMER_CHURN_RISK', label: 'Risco de Churn' },
  { value: 'ONBOARDING_COMPLETED', label: 'Onboarding Concluído' },
  { value: 'CAMPAIGN_SENT', label: 'Campanha Enviada' },
  { value: 'WORKFLOW_TRIGGERED', label: 'Workflow Disparado' },
  { value: 'WORKFLOW_COMPLETED', label: 'Workflow Concluído' },
];

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

function StepConfigEditor({ step, index, onUpdate }: { step: any; index: number; onUpdate: (i: number, config: any) => void }) {
  const config = step.config || {};
  const setField = (field: string, value: any) => onUpdate(index, { ...config, [field]: value });

  switch (step.type) {
    case 'SEND_EMAIL':
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>Destinatário</Label><Input value={config.to || ''} onChange={(e) => setField('to', e.target.value)} placeholder="owner ou email" /></div>
          <div><Label>Assunto</Label><Input value={config.subject || ''} onChange={(e) => setField('subject', e.target.value)} placeholder="Assunto do email" /></div>
          <div className="md:col-span-2"><Label>Template</Label><Input value={config.template || ''} onChange={(e) => setField('template', e.target.value)} placeholder="welcome, follow-up, overdue..." /></div>
        </div>
      );
    case 'SEND_WHATSAPP':
      return (
        <div><Label>Mensagem</Label><textarea className="w-full border rounded px-3 py-2 text-sm bg-card min-h-[80px]" value={config.message || ''} onChange={(e) => setField('message', e.target.value)} placeholder="Texto da mensagem" /></div>
      );
    case 'CREATE_TASK':
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>Título da Tarefa</Label><Input value={config.title || ''} onChange={(e) => setField('title', e.target.value)} placeholder="Ex: Entrar em contato com cliente" /></div>
          <div><Label>Prioridade</Label><select className="w-full border rounded px-3 py-2 text-sm bg-card" value={config.priority || 'MEDIUM'} onChange={(e) => setField('priority', e.target.value)}><option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option></select></div>
        </div>
      );
    case 'UPDATE_STATUS':
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>Entidade</Label><select className="w-full border rounded px-3 py-2 text-sm bg-card" value={config.entity || 'TRANSACTION'} onChange={(e) => setField('entity', e.target.value)}><option value="TRANSACTION">Transação</option><option value="CUSTOMER">Cliente</option><option value="ORDER">Pedido</option><option value="PRODUCT">Produto</option></select></div>
          <div><Label>Novo Status</Label><Input value={config.newStatus || ''} onChange={(e) => setField('newStatus', e.target.value)} placeholder="PAID, ACTIVE, CANCELLED..." /></div>
        </div>
      );
    case 'WEBHOOK':
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>URL</Label><Input value={config.url || ''} onChange={(e) => setField('url', e.target.value)} placeholder="https://..." /></div>
          <div><Label>Método</Label><select className="w-full border rounded px-3 py-2 text-sm bg-card" value={config.method || 'POST'} onChange={(e) => setField('method', e.target.value)}><option value="POST">POST</option><option value="PUT">PUT</option><option value="PATCH">PATCH</option></select></div>
        </div>
      );
    case 'AI_ACTION':
      return (
        <div><Label>Prompt para IA</Label><textarea className="w-full border rounded px-3 py-2 text-sm bg-card min-h-[80px]" value={config.prompt || ''} onChange={(e) => setField('prompt', e.target.value)} placeholder="Descreva o que a IA deve fazer..." /></div>
      );
    case 'DELAY':
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>Duração</Label><Input type="number" value={config.seconds || 60} onChange={(e) => setField('seconds', Number(e.target.value))} /></div>
          <div className="flex items-end"><span className="text-sm text-muted-foreground pb-2">segundos</span></div>
        </div>
      );
    case 'CONDITION':
      return (
        <div className="grid gap-3 md:grid-cols-3">
          <div><Label>Campo</Label><Input value={config.field || ''} onChange={(e) => setField('field', e.target.value)} placeholder="amount, status..." /></div>
          <div><Label>Operador</Label><select className="w-full border rounded px-3 py-2 text-sm bg-card" value={config.operator || 'equals'} onChange={(e) => setField('operator', e.target.value)}><option value="equals">Igual a</option><option value="not_equals">Diferente de</option><option value="greater_than">Maior que</option><option value="less_than">Menor que</option><option value="contains">Contém</option></select></div>
          <div><Label>Valor</Label><Input value={config.value || ''} onChange={(e) => setField('value', e.target.value)} placeholder="Valor de comparação" /></div>
        </div>
      );
    default:
      return null;
  }
}

export default function NovoWorkflowPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('TRANSACTION_CREATED');
  const [steps, setSteps] = useState<any[]>([]);

  const createMutation = useMutation({
    mutationFn: () => api.post('/workflows', { name, trigger, steps }),
    onSuccess: () => router.push('/workflows'),
  });

  const addStep = () => {
    setSteps([...steps, { type: 'SEND_EMAIL', order: steps.length + 1, config: {} }]);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const next = [...steps];
    next[index] = { ...next[index], [field]: value };
    setSteps(next);
  };

  const updateStepConfig = (index: number, config: any) => {
    const next = [...steps];
    next[index] = { ...next[index], config };
    setSteps(next);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Novo Workflow</h1>
        <Button variant="outline" onClick={() => router.push('/workflows')}>Cancelar</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Follow-up pós-venda" />
          </div>
          <div>
            <Label>Gatilho (Trigger)</Label>
            <select
              className="w-full border rounded px-3 py-2 text-sm bg-card"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
            >
              {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Passos</CardTitle>
              <CardDescription>Defina as ações que serão executadas quando o gatilho disparar</CardDescription>
            </div>
            <Button size="sm" onClick={addStep} className="gap-1"><Plus className="h-4 w-4" /> Adicionar</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Passo {index + 1}</span>
                <Button size="sm" variant="ghost" onClick={() => removeStep(index)}><Trash2 className="h-3 w-3" /></Button>
              </div>
              <div>
                <Label>Tipo de Ação</Label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm bg-card"
                  value={step.type}
                  onChange={(e) => updateStep(index, 'type', e.target.value)}
                >
                  {STEP_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <StepConfigEditor step={step} index={index} onUpdate={updateStepConfig} />
            </div>
          ))}
          {steps.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum passo adicionado. Clique em &quot;Adicionar&quot; para começar.
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        disabled={!name || steps.length === 0 || createMutation.isPending}
        onClick={() => createMutation.mutate()}
      >
        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Criar Workflow
      </Button>

      {createMutation.isError && (
        <Card className="border-red-300">
          <CardContent className="py-4">
            <p className="text-sm text-red-600">Erro ao criar workflow. Verifique os dados e tente novamente.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
