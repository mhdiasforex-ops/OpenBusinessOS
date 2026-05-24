'use client';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Bot, MessageSquare, Brain, TrendingUp, Users, Loader2, Send, Star, Zap, Workflow, BarChart3, Clock } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Agent {
  id: string;
  name: string;
  capabilities: string[];
}

interface Conversation {
  id: string;
  organizationId: string;
  agent: string;
  messages: any[];
  createdAt: string;
}

export default function AiAgentPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'chat' | 'agents' | 'query' | 'workflow' | 'history'>('chat');
  const [chatForm, setChatForm] = useState({ message: '', agent: 'orchestrator', context: '' });
  const [queryForm, setQueryForm] = useState({ query: '', timeframe: '' });
  const [workflowForm, setWorkflowForm] = useState({ type: 'daily_report', data: '{}' });
  const [feedbackForm, setFeedbackForm] = useState({ conversationId: '', rating: 5, comment: '' });
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);

  const { data: agents, isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ['ai-agents'],
    queryFn: async () => { const r = await api.get('/ai-agent/agents'); return (Array.isArray(r) ? r : []) as Agent[]; },
  });

  const { data: conversations, isLoading: convLoading } = useQuery<{ data: Conversation[]; total: number }>({
    queryKey: ['ai-conversations'],
    queryFn: async () => { const r = await api.get('/ai-agent/conversations'); return r as any; },
  });

  const chatMutation = useMutation({
    mutationFn: (data: any) => api.post('/ai-agent/chat', data),
    onSuccess: (response: any) => {
      setChatHistory(h => [...h, { role: 'user', content: chatForm.message }, { role: 'assistant', content: response?.response || response?.message || JSON.stringify(response) }]);
      setChatForm(f => ({ ...f, message: '' }));
    },
  });

  const queryMutation = useMutation({
    mutationFn: (data: any) => api.post('/ai-agent/query', data),
  });

  const workflowMutation = useMutation({
    mutationFn: (data: any) => api.post('/ai-agent/workflow', data),
  });

  const feedbackMutation = useMutation({
    mutationFn: (data: any) => api.post('/ai-agent/feedback', data),
  });

  const agentIcons: Record<string, React.ElementType> = {
    orchestrator: Brain, finance: TrendingUp, crm: Users, fiscal: BarChart3, support: MessageSquare,
  };
  const agentColors: Record<string, string> = {
    orchestrator: 'text-purple-600', finance: 'text-green-600', crm: 'text-blue-600', fiscal: 'text-orange-600', support: 'text-cyan-600',
  };

  const tabs = [
    { key: 'chat' as const, label: 'Chat', icon: MessageSquare },
    { key: 'agents' as const, label: 'Agentes', icon: Bot },
    { key: 'query' as const, label: 'Consulta', icon: Brain },
    { key: 'workflow' as const, label: 'Workflows', icon: Workflow },
    { key: 'history' as const, label: 'Historico', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Multiagente</h1>
        <Badge variant="outline" className="gap-1"><Zap className="h-3 w-3" /> {agents?.length || 0} agentes ativos</Badge>
      </div>

      {/* Agent Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {agentsLoading ? (
          <div className="col-span-full flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          (agents || []).map((agent) => {
            const Icon = agentIcons[agent.id] || Bot;
            return (
              <Card key={agent.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setChatForm(f => ({ ...f, agent: agent.id }))}>
                <CardContent className="pt-4 text-center">
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${agentColors[agent.id] || 'text-gray-600'}`} />
                  <p className="text-sm font-medium">{agent.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{agent.capabilities.length} capacidades</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 h-64 overflow-y-auto space-y-2 bg-muted/30">
                {chatHistory.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">Inicie uma conversa com um agente AI</p>}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <select className="border rounded-md px-2 py-2 text-sm" value={chatForm.agent} onChange={e => setChatForm(f => ({ ...f, agent: e.target.value }))}>
                  <option value="orchestrator">Orquestrador</option>
                  <option value="finance">Financeiro</option>
                  <option value="crm">CRM</option>
                  <option value="fiscal">Fiscal</option>
                  <option value="support">Suporte</option>
                </select>
                <Input className="flex-1" placeholder="Digite sua mensagem..." value={chatForm.message} onChange={e => setChatForm(f => ({ ...f, message: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter' && chatForm.message) chatMutation.mutate(chatForm); }} />
                <Button className="gap-2" onClick={() => chatMutation.mutate(chatForm)} disabled={chatMutation.isPending || !chatForm.message}>
                  {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Agents Tab */}
          {activeTab === 'agents' && (
            agentsLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> :
            <div className="space-y-3">
              {(agents || []).map((agent) => {
                const Icon = agentIcons[agent.id] || Bot;
                return (
                  <div key={agent.id} className="flex items-center gap-4 p-4 rounded-lg border">
                    <Icon className={`h-8 w-8 ${agentColors[agent.id] || 'text-gray-600'}`} />
                    <div className="flex-1">
                      <p className="font-medium">{agent.name}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {agent.capabilities.map((c, i) => <Badge key={i} variant="outline" className="text-xs">{c}</Badge>)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Query Tab */}
          {activeTab === 'query' && (
            <div className="space-y-4 max-w-lg">
              <CardDescription>Consulta inteligente ao banco de dados</CardDescription>
              <div><Label>Pergunta</Label><Textarea rows={3} placeholder="Ex: Qual o faturamento do ultimo mes?" value={queryForm.query} onChange={e => setQueryForm(f => ({ ...f, query: e.target.value }))} /></div>
              <div><Label>Periodo (opcional)</Label><Input placeholder="ultimo_mes" value={queryForm.timeframe} onChange={e => setQueryForm(f => ({ ...f, timeframe: e.target.value }))} /></div>
              <Button className="gap-2" onClick={() => queryMutation.mutate(queryForm)} disabled={queryMutation.isPending || !queryForm.query}>
                {queryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />} Consultar
              </Button>
              {queryMutation.data && (
                <Card className="border-blue-300 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardContent className="pt-4"><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(queryMutation.data, null, 2)}</pre></CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Workflow Tab */}
          {activeTab === 'workflow' && (
            <div className="space-y-4 max-w-lg">
              <CardDescription>Disparar workflows automatizados</CardDescription>
              <div>
                <Label>Tipo</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={workflowForm.type} onChange={e => setWorkflowForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="daily_report">Relatorio Diario</option>
                  <option value="financial_analysis">Analise Financeira</option>
                  <option value="customer_insights">Insights de Clientes</option>
                  <option value="fiscal_compliance">Conformidade Fiscal</option>
                </select>
              </div>
              <div><Label>Dados (JSON)</Label><Textarea rows={3} placeholder='{"key": "value"}' value={workflowForm.data} onChange={e => setWorkflowForm(f => ({ ...f, data: e.target.value }))} /></div>
              <Button className="gap-2" onClick={() => { try { workflowMutation.mutate({ type: workflowForm.type, data: JSON.parse(workflowForm.data) }); } catch { /* invalid json */ } }} disabled={workflowMutation.isPending}>
                {workflowMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Workflow className="h-4 w-4" />} Executar Workflow
              </Button>
              {workflowMutation.data && (
                <Card className="border-green-300 bg-green-50/50 dark:bg-green-950/20">
                  <CardContent className="pt-4"><pre className="text-xs whitespace-pre-wrap">{JSON.stringify(workflowMutation.data, null, 2)}</pre></CardContent>
                </Card>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            convLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> :
            conversations?.data?.length ? (
              <div className="space-y-2">
                {conversations.data.map((conv) => (
                  <div key={conv.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{conv.agent}</p>
                      <p className="text-xs text-muted-foreground">{conv.messages?.length || 0} mensagens</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{new Date(conv.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-center py-8">Nenhuma conversa</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
