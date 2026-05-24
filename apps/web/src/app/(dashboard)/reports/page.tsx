'use client';


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useState, useMemo } from 'react';
import { BarChart3, Search, Plus, FileText, Play, Clock, Settings, ToggleLeft, Loader2, X, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const FORMATS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'XLSX', label: 'Excel' },
  { value: 'CSV', label: 'CSV' },
  { value: 'JSON', label: 'JSON' },
];

const SCHEDULES = [
  { value: 'ONCE', label: 'Único' },
  { value: 'DAILY', label: 'Diário' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'YEARLY', label: 'Anual' },
];

const INITIAL_FORM = { name: '', type: '', format: 'PDF', schedule: 'ONCE' };

export default function ReportsPage() {
  const [tab, setTab] = useState<'reports' | 'types' | 'scheduled'>('reports');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const queryClient = useQueryClient();

  const { data: reports, isLoading: loadingReports } = useQuery({
    queryKey: ['reports'],
    queryFn: () => api.get('/reports'),
  });

  const { data: reportTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['report-types'],
    queryFn: () => api.get('/reports/types'),
  });

  const runMutation = useMutation({
    mutationFn: (id: string) => api.post(`/reports/${id}/run`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.put(`/reports/${id}/toggle-active`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/reports', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setDialogOpen(false);
      setForm(INITIAL_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/reports/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const allReports = useMemo(() => {
    const raw = (reports as any)?.items ?? (reports as any)?.data ?? reports ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [reports]);

  const allTypes = useMemo(() => {
    const raw = (reportTypes as any)?.data ?? reportTypes ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [reportTypes]);

  const filteredReports = useMemo(() => {
    let list = allReports;
    if (typeFilter) list = list.filter((r: any) => r.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r: any) =>
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.type?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allReports, search, typeFilter]);

  const scheduledReports = useMemo(() => allReports.filter((r: any) => r.schedule !== 'ONCE' && r.isActive), [allReports]);

  const kpis = useMemo(() => ({
    total: allReports.length,
    active: allReports.filter((r: any) => r.isActive).length,
    scheduled: scheduledReports.length,
    types: allTypes.length,
  }), [allReports, scheduledReports, allTypes]);

  const formatBadge = (format: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      PDF: { label: 'PDF', variant: 'destructive' as any },
      XLSX: { label: 'Excel', variant: 'default' },
      CSV: { label: 'CSV', variant: 'secondary' },
      JSON: { label: 'JSON', variant: 'outline' },
    };
    const info = map[format] || { label: format, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const scheduleLabel = (schedule: string) => {
    const map: Record<string, string> = {
      DAILY: 'Diario',
      WEEKLY: 'Semanal',
      MONTHLY: 'Mensal',
      QUARTERLY: 'Trimestral',
      YEARLY: 'Anual',
      ONCE: 'Unico',
    };
    return map[schedule] || schedule;
  };

  const typeLabel = (type: string) => {
    const found = allTypes.find((t: any) => t.value === type);
    return found?.label || type;
  };

  const tabs = [
    { key: 'reports', label: 'Relatorios', icon: FileText },
    { key: 'types', label: 'Tipos', icon: BarChart3 },
    { key: 'scheduled', label: 'Agendados', icon: Clock },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Relatorios</h1>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo Relatorio</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Relatório</DialogTitle>
            <Button type="button" variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <select id="type" className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                <option value="">Selecione um tipo</option>
                {allTypes.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Formato</Label>
              <select id="format" className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} required>
                {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Agendamento</Label>
              <select id="schedule" className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} required>
                {SCHEDULES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Relatorios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{kpis.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <ToggleLeft className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{kpis.active}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendados</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{kpis.scheduled}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos Disponiveis</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{kpis.types}</div></CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-t-md transition-colors ${tab === t.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {tab === 'reports' && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar relatorio..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
            <option value="">Todos os tipos</option>
            {allTypes.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}

      {/* Reports Table */}
      {tab === 'reports' && (
        <Card>
          <CardHeader><CardTitle>Relatorios</CardTitle></CardHeader>
          <CardContent>
            {loadingReports ? <p className="text-muted-foreground">Carregando...</p> : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Agendamento</TableHead>
                    <TableHead>Ultima Execucao</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{typeLabel(r.type)}</TableCell>
                      <TableCell>{formatBadge(r.format)}</TableCell>
                      <TableCell>{scheduleLabel(r.schedule)}</TableCell>
                      <TableCell>{r.lastRunAt ? new Date(r.lastRunAt).toLocaleDateString('pt-BR') : 'Nunca'}</TableCell>
                      <TableCell>
                        <Badge variant={r.isActive ? 'default' : 'secondary'}>{r.isActive ? 'Ativo' : 'Inativo'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => runMutation.mutate(r.id)}>
                            <Play className="h-3 w-3 mr-1" />Executar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleMutation.mutate({ id: r.id, isActive: !r.isActive })}>
                            <ToggleLeft className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id, r.name)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredReports.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum relatorio encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Types */}
      {tab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingTypes ? <p className="text-muted-foreground">Carregando...</p> : (
            allTypes.map((t: any) => (
              <Card key={t.value}>
                <CardHeader>
                  <CardTitle className="text-lg">{t.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Tipo: <code className="bg-muted px-1 py-0.5 rounded">{t.value}</code></p>
                  <p className="text-sm text-muted-foreground mt-2">Relatorios criados: {allReports.filter((r: any) => r.type === t.value).length}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Scheduled */}
      {tab === 'scheduled' && (
        <Card>
          <CardHeader><CardTitle>Relatorios Agendados</CardTitle></CardHeader>
          <CardContent>
            {scheduledReports.length === 0 ? (
              <p className="text-muted-foreground text-center">Nenhum relatorio agendado</p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Agendamento</TableHead>
                    <TableHead>Proxima Execucao</TableHead>
                    <TableHead>Ultima Execucao</TableHead>
                    <TableHead>Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledReports.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{typeLabel(r.type)}</TableCell>
                      <TableCell>{scheduleLabel(r.schedule)}</TableCell>
                      <TableCell>{r.nextRunAt ? new Date(r.nextRunAt).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell>{r.lastRunAt ? new Date(r.lastRunAt).toLocaleDateString('pt-BR') : 'Nunca'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => runMutation.mutate(r.id)}>
                            <Play className="h-3 w-3 mr-1" />Executar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleMutation.mutate({ id: r.id, isActive: false })}>
                            Desativar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
