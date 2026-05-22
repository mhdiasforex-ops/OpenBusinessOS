'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
            <Button size="sm" onClick={addStep}>+ Adicionar Passo</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Passo {index + 1}</span>
                <Button size="sm" variant="ghost" onClick={() => removeStep(index)}>Remover</Button>
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
              {step.type === 'SEND_EMAIL' && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Destinatário</Label>
                    <Input
                      value={step.config.to || ''}
                      onChange={(e) => updateStep(index, 'config', { ...step.config, to: e.target.value })}
                      placeholder="owner ou email"
                    />
                  </div>
                  <div>
                    <Label>Assunto</Label>
                    <Input
                      value={step.config.subject || ''}
                      onChange={(e) => updateStep(index, 'config', { ...step.config, subject: e.target.value })}
                      placeholder="Assunto do email"
                    />
                  </div>
                </div>
              )}
              {step.type === 'SEND_WHATSAPP' && (
                <div>
                  <Label>Mensagem</Label>
                  <textarea
                    className="w-full border rounded px-3 py-2 text-sm bg-card min-h-[80px]"
                    value={step.config.message || ''}
                    onChange={(e) => updateStep(index, 'config', { ...step.config, message: e.target.value })}
                    placeholder="Texto da mensagem"
                  />
                </div>
              )}
              {step.type === 'WEBHOOK' && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>URL</Label>
                    <Input
                      value={step.config.url || ''}
                      onChange={(e) => updateStep(index, 'config', { ...step.config, url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Método</Label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm bg-card"
                      value={step.config.method || 'POST'}
                      onChange={(e) => updateStep(index, 'config', { ...step.config, method: e.target.value })}
                    >
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>
                </div>
              )}
              {step.type === 'DELAY' && (
                <div>
                  <Label>Segundos de espera</Label>
                  <Input
                    type="number"
                    value={step.config.seconds || 60}
                    onChange={(e) => updateStep(index, 'config', { ...step.config, seconds: Number(e.target.value) })}
                  />
                </div>
              )}
              {step.type === 'CREATE_TASK' && (
                <div>
                  <Label>Título da Tarefa</Label>
                  <Input
                    value={step.config.title || ''}
                    onChange={(e) => updateStep(index, 'config', { ...step.config, title: e.target.value })}
                    placeholder="Ex: Entrar em contato com cliente"
                  />
                </div>
              )}
              {step.type === 'AI_ACTION' && (
                <div>
                  <Label>Prompt para IA</Label>
                  <textarea
                    className="w-full border rounded px-3 py-2 text-sm bg-card min-h-[80px]"
                    value={step.config.prompt || ''}
                    onChange={(e) => updateStep(index, 'config', { ...step.config, prompt: e.target.value })}
                    placeholder="Descreva o que a IA deve fazer..."
                  />
                </div>
              )}
            </div>
          ))}
          {steps.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum passo adicionado. Clique em "+ Adicionar Passo" para começar.
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        disabled={!name || steps.length === 0}
        onClick={() => createMutation.mutate()}
      >
        Criar Workflow
      </Button>
    </div>
  );
}
