'use client';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatCurrency } from '@openbusinessos/utils';
import { FileText, ShoppingCart, Receipt, BarChart3, Loader2, Plus, Download, Calculator, Send, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FiscalStats {
  totalNfe: number;
  totalNfce: number;
  totalNfse: number;
  totalValue: number;
}

interface NfeDoc {
  id: string;
  numero: string;
  destinatario: string;
  valor: number;
  status: string;
  dataEmissao: string;
}

interface SpedReport {
  id: string;
  type: string;
  period: string;
  year: number;
  status: string;
  createdAt: string;
}

export default function FiscalPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'nfe' | 'nfce' | 'nfse' | 'sped' | 'icms'>('nfe');
  const [icmsForm, setIcmsForm] = useState({ origin: '', destination: '', ncm: '', value: '' });
  const [icmsResult, setIcmsResult] = useState<any>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<FiscalStats>({
    queryKey: ['fiscal-stats'],
    queryFn: async () => { const r = await api.get('/fiscal/statistics'); return r as FiscalStats; },
  });

  const { data: nfeList, isLoading: nfeLoading } = useQuery<NfeDoc[]>({
    queryKey: ['fiscal-nfe'],
    queryFn: async () => { const r = await api.get('/fiscal/nfe'); return (Array.isArray(r) ? r : []) as NfeDoc[]; },
  });

  const { data: nfceList, isLoading: nfceLoading } = useQuery<NfeDoc[]>({
    queryKey: ['fiscal-nfce'],
    queryFn: async () => { const r = await api.get('/fiscal/nfce'); return (Array.isArray(r) ? r : []) as NfeDoc[]; },
  });

  const { data: nfseList, isLoading: nfseLoading } = useQuery<NfeDoc[]>({
    queryKey: ['fiscal-nfse'],
    queryFn: async () => { const r = await api.get('/fiscal/nfse'); return (Array.isArray(r) ? r : []) as NfeDoc[]; },
  });

  const { data: spedReports, isLoading: spedLoading } = useQuery<SpedReport[]>({
    queryKey: ['fiscal-sped'],
    queryFn: async () => { const r = await api.get('/fiscal/sped/reports'); return (Array.isArray(r) ? r : []) as SpedReport[]; },
  });

  const emitNfeMutation = useMutation({
    mutationFn: (data: any) => api.post('/fiscal/nfe', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fiscal-nfe'] }); queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] }); },
  });

  const emitNfceMutation = useMutation({
    mutationFn: (data: any) => api.post('/fiscal/nfce', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fiscal-nfce'] }); queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] }); },
  });

  const emitNfseMutation = useMutation({
    mutationFn: (data: any) => api.post('/fiscal/nfse', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fiscal-nfse'] }); queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] }); },
  });

  const cancelNfeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/fiscal/nfe/${id}/cancelar`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fiscal-nfe'] }); queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] }); },
  });

  const cancelNfseMutation = useMutation({
    mutationFn: (numero: string) => api.post(`/fiscal/nfse/${numero}/cancelar`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fiscal-nfse'] }); queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] }); },
  });

  const generateSpedMutation = useMutation({
    mutationFn: (data: any) => api.post('/fiscal/sped/generate', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fiscal-sped'] }),
  });

  const simulateIcmsMutation = useMutation({
    mutationFn: (data: any) => api.get('/fiscal/icms/simulate', data),
    onSuccess: (data) => setIcmsResult(data),
  });

  const statusColor: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    AUTORIZADO: 'default', EMITIDA: 'default', CANCELADA: 'destructive', DENEGADA: 'destructive', PENDENTE: 'secondary', PROCESSANDO: 'outline',
  };

  const tabs = [
    { key: 'nfe' as const, label: 'NF-e', icon: FileText },
    { key: 'nfce' as const, label: 'NFC-e', icon: ShoppingCart },
    { key: 'nfse' as const, label: 'NFS-e', icon: Receipt },
    { key: 'sped' as const, label: 'SPED', icon: Download },
    { key: 'icms' as const, label: 'ICMS', icon: Calculator },
  ];

  const renderDocTable = (docs: NfeDoc[], loading: boolean, cancelMutation?: { mutate: (id: string) => void, isPending: boolean }) => {
    if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    if (!docs?.length) return <p className="text-muted-foreground text-center py-8">Nenhum documento encontrado</p>;
    return (
      <div className="space-y-2">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">NF {doc.numero}</p>
              <p className="text-xs text-muted-foreground">{doc.destinatario}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right space-y-1">
                <p className="text-sm font-medium">{formatCurrency(doc.valor)}</p>
                <Badge variant={statusColor[doc.status] || 'outline'}>{doc.status}</Badge>
              </div>
              {doc.status !== 'CANCELADA' && cancelMutation && (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={cancelMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Cancelar NF ${doc.numero}?`)) {
                      cancelMutation.mutate(doc.numero);
                    }
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Modulo Fiscal</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => emitNfeMutation.mutate({})} disabled={emitNfeMutation.isPending}>
            {emitNfeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Nova NF-e
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => emitNfceMutation.mutate({})} disabled={emitNfceMutation.isPending}>
            {emitNfceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Nova NFC-e
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => emitNfseMutation.mutate({})} disabled={emitNfseMutation.isPending}>
            {emitNfseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Nova NFS-e
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600" /> NF-e Emitidas</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats?.totalNfe || 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-green-600" /> NFC-e Emitidas</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats?.totalNfce || 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4 text-purple-600" /> NFS-e Emitidas</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats?.totalNfse || 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-orange-600" /> Valor Total</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatCurrency(stats?.totalValue || 0)}</p></CardContent>
          </Card>
        </div>
      )}

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

      {/* Tab Content */}
      <Card>
        <CardContent className="pt-6">
          {activeTab === 'nfe' && renderDocTable(nfeList || [], !!nfeLoading, cancelNfeMutation)}
          {activeTab === 'nfce' && renderDocTable(nfceList || [], !!nfceLoading)}
          {activeTab === 'nfse' && renderDocTable(nfseList || [], !!nfseLoading, cancelNfseMutation)}
          {activeTab === 'sped' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button className="gap-2" onClick={() => generateSpedMutation.mutate({ type: 'SPED_FISCAL', period: new Date().toISOString().slice(0, 7), year: new Date().getFullYear() })} disabled={generateSpedMutation.isPending}>
                  {generateSpedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Gerar SPED Fiscal
                </Button>
              </div>
              {spedLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
                spedReports?.length ? (
                  <div className="space-y-2">
                    {spedReports.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium">{r.type}</p>
                          <p className="text-xs text-muted-foreground">Periodo: {r.period} / {r.year}</p>
                        </div>
                        <Badge variant={statusColor[r.status] || 'outline'}>{r.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground text-center py-8">Nenhum relatorio SPED</p>
              )}
            </div>
          )}
          {activeTab === 'icms' && (
            <div className="space-y-4 max-w-lg">
              <CardDescription>Simulador de ICMS Interestadual</CardDescription>
              <div className="grid gap-3">
                <div><Label>UF Origem</Label><Input placeholder="SP" value={icmsForm.origin} onChange={e => setIcmsForm(f => ({ ...f, origin: e.target.value }))} /></div>
                <div><Label>UF Destino</Label><Input placeholder="RJ" value={icmsForm.destination} onChange={e => setIcmsForm(f => ({ ...f, destination: e.target.value }))} /></div>
                <div><Label>NCM</Label><Input placeholder="0000.00.00" value={icmsForm.ncm} onChange={e => setIcmsForm(f => ({ ...f, ncm: e.target.value }))} /></div>
                <div><Label>Valor</Label><Input type="number" placeholder="0.00" value={icmsForm.value} onChange={e => setIcmsForm(f => ({ ...f, value: e.target.value }))} /></div>
              </div>
              <Button className="gap-2" onClick={() => simulateIcmsMutation.mutate(icmsForm)} disabled={simulateIcmsMutation.isPending}>
                {simulateIcmsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />} Simular ICMS
              </Button>
              {icmsResult && (
                <Card className="border-blue-300 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardHeader><CardTitle className="text-sm">Resultado da Simulacao</CardTitle></CardHeader>
                  <CardContent>
                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(icmsResult, null, 2)}</pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
