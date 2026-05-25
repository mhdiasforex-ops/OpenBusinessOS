'use client';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MessageSquare, Mail, Smartphone, Send, Loader2, RefreshCw, CheckCircle, Clock, XCircle, Phone, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Conversation {
  id: string;
  channel: string;
  contact: string;
  lastMessage: string;
  status: string;
  unreadCount: number;
  updatedAt: string;
}

interface Template {
  id: string;
  name: string;
  channel: string;
  content: string;
}

const channelIcons: Record<string, React.ElementType> = {
  WHATSAPP: MessageSquare, EMAIL: Mail, SMS: Smartphone,
};
const channelColors: Record<string, string> = {
  WHATSAPP: 'text-green-600', EMAIL: 'text-blue-600', SMS: 'text-purple-600',
};
const statusConfig: Record<string, { icon: React.ElementType; color: string; badge: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  OPEN: { icon: Clock, color: 'text-blue-500', badge: 'outline' },
  ACTIVE: { icon: RefreshCw, color: 'text-green-500', badge: 'default' },
  CLOSED: { icon: CheckCircle, color: 'text-gray-500', badge: 'secondary' },
  PENDING: { icon: Clock, color: 'text-yellow-500', badge: 'outline' },
  SENT: { icon: CheckCircle, color: 'text-green-500', badge: 'default' },
  FAILED: { icon: XCircle, color: 'text-red-500', badge: 'destructive' },
};

export default function OmnichannelPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'conversations' | 'send' | 'templates' | 'history'>('conversations');
  const [sendForm, setSendForm] = useState({ channel: 'WHATSAPP', to: '', subject: '', content: '' });

  const { data: conversations, isLoading: convLoading } = useQuery<Conversation[]>({
    queryKey: ['omnichannel-conversations'],
    queryFn: async () => { const r = await api.get('/omnichannel/conversations'); return (Array.isArray(r) ? r : []) as Conversation[]; },
  });

  const { data: templates, isLoading: tplLoading } = useQuery<Template[]>({
    queryKey: ['omnichannel-templates'],
    queryFn: async () => { const r = await api.get('/omnichannel/templates'); return (Array.isArray(r) ? r : []) as Template[]; },
  });

  const { data: history, isLoading: histLoading } = useQuery<any[]>({
    queryKey: ['omnichannel-history'],
    queryFn: async () => { const r = await api.get('/omnichannel/history'); return (Array.isArray(r) ? r : []) as any[]; },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: any) => api.post('/omnichannel/send', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['omnichannel-conversations'] }); setSendForm({ channel: 'WHATSAPP', to: '', subject: '', content: '' }); },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/omnichannel/conversations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['omnichannel-conversations'] }),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/omnichannel/templates/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['omnichannel-templates'] }),
  });

  const tabs = [
    { key: 'conversations' as const, label: 'Conversas', icon: MessageSquare },
    { key: 'send' as const, label: 'Enviar Mensagem', icon: Send },
    { key: 'templates' as const, label: 'Templates', icon: Mail },
    { key: 'history' as const, label: 'Historico', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Comunicacao Omnichannel</h1>

      {/* Channel Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-green-600" /> WhatsApp</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{conversations?.filter(c => c.channel === 'WHATSAPP').length || 0}</p><p className="text-xs text-muted-foreground">conversas ativas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" /> Email</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{conversations?.filter(c => c.channel === 'EMAIL').length || 0}</p><p className="text-xs text-muted-foreground">conversas ativas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Smartphone className="h-4 w-4 text-purple-600" /> SMS</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{conversations?.filter(c => c.channel === 'SMS').length || 0}</p><p className="text-xs text-muted-foreground">mensagens enviadas</p></CardContent>
        </Card>
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
          {/* Conversations Tab */}
          {activeTab === 'conversations' && (
            convLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> :
            conversations?.length ? (
              <div className="space-y-2">
                {conversations.map((conv) => {
                  const Icon = channelIcons[conv.channel] || MessageSquare;
                  const sc = statusConfig[conv.status] || statusConfig.OPEN;
                  const StatusIcon = sc.icon;
                  return (
                    <div key={conv.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${channelColors[conv.channel] || ''}`} />
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{conv.contact}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-md">{conv.lastMessage}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {conv.unreadCount > 0 && <Badge>{conv.unreadCount}</Badge>}
                        <Badge variant={sc.badge}>{conv.status}</Badge>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={(e) => { e.stopPropagation(); if (confirm('Excluir conversa?')) deleteConversationMutation.mutate(conv.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-muted-foreground text-center py-8">Nenhuma conversa</p>
          )}

          {/* Send Message Tab */}
          {activeTab === 'send' && (
            <div className="space-y-4 max-w-lg">
              <CardDescription>Enviar mensagem por canal</CardDescription>
              <div className="grid gap-3">
                <div>
                  <Label>Canal</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={sendForm.channel} onChange={e => setSendForm(f => ({ ...f, channel: e.target.value }))}>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
                <div><Label>Destinatario</Label><Input placeholder={sendForm.channel === 'EMAIL' ? 'email@exemplo.com' : '+5511999999999'} value={sendForm.to} onChange={e => setSendForm(f => ({ ...f, to: e.target.value }))} /></div>
                {sendForm.channel === 'EMAIL' && <div><Label>Assunto</Label><Input placeholder="Assunto do email" value={sendForm.subject} onChange={e => setSendForm(f => ({ ...f, subject: e.target.value }))} /></div>}
                <div><Label>Mensagem</Label><Textarea rows={4} placeholder="Digite sua mensagem..." value={sendForm.content} onChange={e => setSendForm(f => ({ ...f, content: e.target.value }))} /></div>
              </div>
              <Button className="gap-2" onClick={() => sendMessageMutation.mutate(sendForm)} disabled={sendMessageMutation.isPending || !sendForm.to || !sendForm.content}>
                {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar
              </Button>
              {sendMessageMutation.isSuccess && <p className="text-sm text-green-600">Mensagem enviada com sucesso!</p>}
              {sendMessageMutation.isError && <p className="text-sm text-red-600">Erro ao enviar mensagem.</p>}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            tplLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> :
            templates?.length ? (
              <div className="space-y-2">
                {templates.map((tpl) => {
                  const Icon = channelIcons[tpl.channel] || Mail;
                  return (
                    <div key={tpl.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${channelColors[tpl.channel] || ''}`} />
                        <div><p className="text-sm font-medium">{tpl.name}</p><p className="text-xs text-muted-foreground">{tpl.content.slice(0, 80)}...</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{tpl.channel}</Badge>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { if (confirm('Excluir template?')) deleteTemplateMutation.mutate(tpl.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-muted-foreground text-center py-8">Nenhum template</p>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            histLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> :
            history?.length ? (
              <div className="space-y-2">
                {history.map((item: any, i: number) => {
                  const Icon = channelIcons[item.channel] || MessageSquare;
                  const sc = statusConfig[item.status] || statusConfig.OPEN;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${channelColors[item.channel] || ''}`} />
                        <div><p className="text-sm font-medium">{item.to || item.contact}</p><p className="text-xs text-muted-foreground">{item.content?.slice(0, 60) || item.lastMessage}</p></div>
                      </div>
                      <div className="text-right"><Badge variant={sc.badge}>{item.status}</Badge><p className="text-xs text-muted-foreground mt-1">{item.sentAt || item.updatedAt}</p></div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-muted-foreground text-center py-8">Nenhum historico</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
