'use client';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Shield, FileDown, Trash2, Eye, UserCheck, Lock, Loader2, Download, AlertTriangle, CheckCircle, Scale, BookOpen, Send } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ConsentRecord {
  id: string;
  subjectId: string;
  purpose: string;
  lawfulBasis: string;
  source: string;
  status: string;
  createdAt: string;
  revokedAt?: string;
}

interface AuditLog {
  id: string;
  subjectId: string;
  action: string;
  metadata: Record<string, any>;
  createdAt: string;
}

const basisLabels: Record<string, string> = {
  CONSENTIMENTO: 'Consentimento',
  CONTRATO: 'Contrato',
  OBRIGACAO_LEGAL: 'Obrigacao Legal',
  TUTELA: 'Tutela',
  INTERESSE_PUBLICO: 'Interesse Publico',
  CREDITO: 'Protecao do Credito',
  INTERESSE_LEGITIMO: 'Interesse Legitimo',
};

const statusBadge: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ATIVO: 'default', REVOGADO: 'destructive', EXPIRADO: 'secondary',
};

export default function LgpdPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'consent' | 'rights' | 'audit' | 'policies' | 'dpo'>('consent');
  const [consentForm, setConsentForm] = useState({ subjectId: '', purpose: '', lawfulBasis: 'CONSENTIMENTO', source: 'web' });
  const [exportForm, setExportForm] = useState({ subjectId: '', format: 'json' as 'json' | 'csv' });
  const [deleteForm, setDeleteForm] = useState({ subjectId: '', reason: '' });
  const [dpoForm, setDpoForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [exportResult, setExportResult] = useState<any>(null);

  const { data: consents, isLoading: consentsLoading } = useQuery<ConsentRecord[]>({
    queryKey: ['lgpd-consents'],
    queryFn: async () => { const r = await api.get('/lgpd/consents/me'); return (Array.isArray(r) ? r : []) as ConsentRecord[]; },
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery<AuditLog[]>({
    queryKey: ['lgpd-audit'],
    queryFn: async () => { const r = await api.get('/lgpd/audit-log'); return (Array.isArray(r) ? r : []) as AuditLog[]; },
  });

  const { data: policies, isLoading: policiesLoading } = useQuery<any[]>({
    queryKey: ['lgpd-policies'],
    queryFn: async () => { const r = await api.get('/lgpd/policies'); return (Array.isArray(r) ? r : []) as any[]; },
  });

  const registerConsentMutation = useMutation({
    mutationFn: (data: any) => api.post('/lgpd/consents', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lgpd-consents'] }); setConsentForm({ subjectId: '', purpose: '', lawfulBasis: 'CONSENTIMENTO', source: 'web' }); },
  });

  const revokeConsentMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/lgpd/consents/${id}/revoke`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lgpd-consents'] }),
  });

  const exportDataMutation = useMutation({
    mutationFn: (data: any) => api.post('/lgpd/data-subject/export', data),
    onSuccess: (data) => setExportResult(data),
  });

  const deleteDataMutation = useMutation({
    mutationFn: (data: any) => api.post('/lgpd/data-subject/delete', data),
  });

  const contactDpoMutation = useMutation({
    mutationFn: (data: any) => api.post('/lgpd/dpo/contact', data),
    onSuccess: () => setDpoForm({ name: '', email: '', subject: '', message: '' }),
  });

  const tabs = [
    { key: 'consent' as const, label: 'Consentimentos', icon: UserCheck },
    { key: 'rights' as const, label: 'Direitos do Titular', icon: Shield },
    { key: 'audit' as const, label: 'Auditoria', icon: Eye },
    { key: 'policies' as const, label: 'Politicas', icon: BookOpen },
    { key: 'dpo' as const, label: 'DPO', icon: Scale },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">LGPD Compliance</h1>
        <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" /> Conformidade</Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4 text-green-600" /> Consentimentos Ativos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{consents?.filter(c => c.status === 'ATIVO').length || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-600" /> Consentimentos Revogados</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{consents?.filter(c => c.status === 'REVOGADO').length || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-blue-600" /> Eventos de Auditoria</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{auditLogs?.length || 0}</p></CardContent>
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
          {/* Consent Tab */}
          {activeTab === 'consent' && (
            <div className="space-y-4">
              <div className="grid gap-3 max-w-lg border rounded-lg p-4">
                <CardHeader className="p-0"><CardTitle className="text-base">Registrar Consentimento</CardTitle></CardHeader>
                <div><Label>ID do Titular</Label><Input placeholder="email ou CPF hash" value={consentForm.subjectId} onChange={e => setConsentForm(f => ({ ...f, subjectId: e.target.value }))} /></div>
                <div><Label>Finalidade</Label><Input placeholder="Ex: Marketing, Processamento de pedidos" value={consentForm.purpose} onChange={e => setConsentForm(f => ({ ...f, purpose: e.target.value }))} /></div>
                <div>
                  <Label>Base Legal</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={consentForm.lawfulBasis} onChange={e => setConsentForm(f => ({ ...f, lawfulBasis: e.target.value }))}>
                    {Object.entries(basisLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <Button className="gap-2" onClick={() => registerConsentMutation.mutate(consentForm)} disabled={registerConsentMutation.isPending || !consentForm.subjectId || !consentForm.purpose}>
                  {registerConsentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />} Registrar
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Consentimentos Registrados</h3>
                {consentsLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> :
                consents?.length ? (
                  consents.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{c.purpose}</p>
                        <p className="text-xs text-muted-foreground">Titular: {c.subjectId} | Base: {basisLabels[c.lawfulBasis] || c.lawfulBasis}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusBadge[c.status] || 'outline'}>{c.status}</Badge>
                        {c.status === 'ATIVO' && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => revokeConsentMutation.mutate(c.id)} disabled={revokeConsentMutation.isPending}>
                            Revogar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : <p className="text-muted-foreground text-center py-8">Nenhum consentimento</p>}
              </div>
            </div>
          )}

          {/* Rights Tab */}
          {activeTab === 'rights' && (
            <div className="space-y-6">
              {/* Export Data */}
              <div className="border rounded-lg p-4 max-w-lg">
                <CardHeader className="p-0"><CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4" /> Exportar Dados</CardTitle></CardHeader>
                <div className="grid gap-3 mt-3">
                  <div><Label>ID do Titular</Label><Input placeholder="email ou CPF hash" value={exportForm.subjectId} onChange={e => setExportForm(f => ({ ...f, subjectId: e.target.value }))} /></div>
                  <div>
                    <Label>Formato</Label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm" value={exportForm.format} onChange={e => setExportForm(f => ({ ...f, format: e.target.value as 'json' | 'csv' }))}>
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                  <Button className="gap-2" onClick={() => exportDataMutation.mutate(exportForm)} disabled={exportDataMutation.isPending || !exportForm.subjectId}>
                    {exportDataMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Exportar
                  </Button>
                  {exportResult && (
                    <Card className="border-blue-300 bg-blue-50/50 dark:bg-blue-950/20">
                      <CardContent className="pt-4"><pre className="text-xs whitespace-pre-wrap max-h-64 overflow-auto">{typeof exportResult === 'string' ? exportResult : JSON.stringify(exportResult, null, 2)}</pre></CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Delete Data */}
              <div className="border rounded-lg p-4 max-w-lg">
                <CardHeader className="p-0"><CardTitle className="text-base flex items-center gap-2 text-destructive"><Trash2 className="h-4 w-4" /> Solicitar Delecao</CardTitle></CardHeader>
                <div className="grid gap-3 mt-3">
                  <div><Label>ID do Titular</Label><Input placeholder="email ou CPF hash" value={deleteForm.subjectId} onChange={e => setDeleteForm(f => ({ ...f, subjectId: e.target.value }))} /></div>
                  <div><Label>Motivo</Label><Textarea rows={2} placeholder="Motivo da solicitacao" value={deleteForm.reason} onChange={e => setDeleteForm(f => ({ ...f, reason: e.target.value }))} /></div>
                  <Button variant="destructive" className="gap-2" onClick={() => deleteDataMutation.mutate(deleteForm)} disabled={deleteDataMutation.isPending || !deleteForm.subjectId}>
                    {deleteDataMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Solicitar Delecao
                  </Button>
                  {deleteDataMutation.isSuccess && <p className="text-sm text-green-600">Solicitacao de delecao processada.</p>}
                </div>
              </div>
            </div>
          )}

          {/* Audit Tab */}
          {activeTab === 'audit' && (
            auditLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> :
            auditLogs?.length ? (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">Titular: {log.subjectId}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-center py-8">Nenhum evento de auditoria</p>
          )}

          {/* Policies Tab */}
          {activeTab === 'policies' && (
            policiesLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> :
            policies?.length ? (
              <div className="space-y-3">
                {policies.map((p: any) => (
                  <Card key={p.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{p.title}</CardTitle>
                        <Badge variant="outline">v{p.version}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">{p.content?.slice(0, 200)}...</p></CardContent>
                  </Card>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-center py-8">Nenhuma politica de privacidade</p>
          )}

          {/* DPO Tab */}
          {activeTab === 'dpo' && (
            <div className="space-y-4 max-w-lg">
              <CardDescription>Contate o Encarregado de Protecao de Dados (DPO)</CardDescription>
              <div className="grid gap-3">
                <div><Label>Nome</Label><Input placeholder="Seu nome" value={dpoForm.name} onChange={e => setDpoForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>Email</Label><Input type="email" placeholder="seu@email.com" value={dpoForm.email} onChange={e => setDpoForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><Label>Assunto</Label><Input placeholder="Assunto da mensagem" value={dpoForm.subject} onChange={e => setDpoForm(f => ({ ...f, subject: e.target.value }))} /></div>
                <div><Label>Mensagem</Label><Textarea rows={4} placeholder="Descreva sua solicitacao..." value={dpoForm.message} onChange={e => setDpoForm(f => ({ ...f, message: e.target.value }))} /></div>
              </div>
              <Button className="gap-2" onClick={() => contactDpoMutation.mutate(dpoForm)} disabled={contactDpoMutation.isPending || !dpoForm.email || !dpoForm.message}>
                {contactDpoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar ao DPO
              </Button>
              {contactDpoMutation.isSuccess && <p className="text-sm text-green-600">Mensagem enviada ao DPO com sucesso!</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
