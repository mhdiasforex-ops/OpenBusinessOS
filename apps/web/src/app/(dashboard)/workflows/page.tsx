'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WorkflowsPage() {
 const router = useRouter();
 const queryClient = useQueryClient();

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.get('/workflows'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.post(`/workflows/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });

  const stepTypeLabels: Record<string, string> = {
    SEND_EMAIL: '📧 Email',
    SEND_WHATSAPP: '📱 WhatsApp',
    CREATE_TASK: '📋 Tarefa',
    UPDATE_STATUS: '🔄 Status',
    WEBHOOK: '🔗 Webhook',
    AI_ACTION: '🤖 IA',
    DELAY: '⏳ Espera',
    CONDITION: '🔀 Condição',
  };

  const items = (workflows || []) as any[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Automações</h1>
        <Button onClick={() => router.push('/workflows/novo')}>+ Novo Workflow</Button>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((wf) => (
            <Card key={wf.id} className={!wf.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    {wf.name}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant={wf.isActive ? 'default' : 'outline'}
                    onClick={() => toggleMutation.mutate(wf.id)}
                  >
                    {wf.isActive ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Gatilho: {wf.trigger}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {wf.steps?.map((step: any) => (
                    <div key={step.id} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{step.order}.</span>
                      <span>{stepTypeLabels[step.type] || step.type}</span>
                    </div>
                  ))}
                  {(!wf.steps || wf.steps.length === 0) && (
                    <p className="text-sm text-muted-foreground">Nenhum passo configurado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
