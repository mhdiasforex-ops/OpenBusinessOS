'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useState, useMemo } from 'react';
import { Calendar, Search, Plus, Clock, CheckCircle, XCircle, Bell, Users, Loader2, X, Trash2 } from 'lucide-react';

export default function SchedulerPage() {
  const [tab, setTab] = useState<'appointments' | 'reminders' | 'stats'>('appointments');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', customerId: '', startsAt: '', endsAt: '', location: '' });
  const queryClient = useQueryClient();

  const { data: appointments, isLoading: loadingAppts } = useQuery({
    queryKey: ['scheduler-appointments'],
    queryFn: () => api.get('/scheduler/appointments'),
  });

  const { data: reminders, isLoading: loadingReminders } = useQuery({
    queryKey: ['scheduler-reminders'],
    queryFn: () => api.get('/scheduler/reminders-pending'),
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['scheduler-stats'],
    queryFn: () => api.get('/scheduler/appointments-count'),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.post(`/scheduler/appointments/${id}/confirm`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduler-appointments'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/scheduler/appointments/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduler-appointments'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/scheduler/appointments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-appointments'] });
      setDialogOpen(false);
      setForm({ title: '', customerId: '', startsAt: '', endsAt: '', location: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/scheduler/appointments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-appointments'] });
    },
  });

  const allAppointments = useMemo(() => {
    const raw = (appointments as any)?.data ?? appointments ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [appointments]);

  const allReminders = useMemo(() => {
    const raw = (reminders as any)?.data ?? reminders ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [reminders]);

  const filteredAppointments = useMemo(() => {
    let list = allAppointments;
    if (statusFilter) list = list.filter((a: any) => a.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a: any) =>
        a.title?.toLowerCase().includes(q) ||
        a.customer?.name?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allAppointments, search, statusFilter]);

  const st = (stats as any) || {};
  const counts = st.counts || {};

  const apptStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      SCHEDULED: { label: 'Agendado', variant: 'outline' },
      CONFIRMED: { label: 'Confirmado', variant: 'default' },
      IN_PROGRESS: { label: 'Em Andamento', variant: 'secondary' },
      COMPLETED: { label: 'Concluido', variant: 'default' },
      CANCELLED: { label: 'Cancelado', variant: 'destructive' },
      NO_SHOW: { label: 'Nao Compareceu', variant: 'destructive' },
    };
    const info = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const statuses = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

  const tabs = [
    { key: 'appointments', label: 'Agendamentos', icon: Calendar },
    { key: 'reminders', label: 'Lembretes', icon: Bell },
    { key: 'stats', label: 'Estatisticas', icon: Users },
  ] as const;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title: form.title,
      customerId: form.customerId,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      location: form.location,
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o agendamento "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agendamentos</h1>
        <Button onClick={() => { setForm({ title: '', customerId: '', startsAt: '', endsAt: '', location: '' }); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Novo Agendamento</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{counts.SCHEDULED || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{counts.CONFIRMED || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{counts.COMPLETED || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lembretes Pendentes</CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-500">{allReminders.length}</div></CardContent>
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

      {/* Search + Filter */}
      {tab === 'appointments' && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por titulo, cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
            <option value="">Todos os status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Appointments Table */}
      {tab === 'appointments' && (
        <Card>
          <CardHeader><CardTitle>Agendamentos</CardTitle></CardHeader>
          <CardContent>
            {loadingAppts ? <p className="text-muted-foreground">Carregando...</p> : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titulo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>{a.customer?.name || '-'}</TableCell>
                      <TableCell>{new Date(a.startsAt).toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{new Date(a.endsAt).toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{a.location || '-'}</TableCell>
                      <TableCell>{apptStatusBadge(a.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {a.status === 'SCHEDULED' && (
                            <Button size="sm" variant="outline" onClick={() => confirmMutation.mutate(a.id)}>
                              <CheckCircle className="h-3 w-3 mr-1" />Confirmar
                            </Button>
                          )}
                          {['SCHEDULED', 'CONFIRMED'].includes(a.status) && (
                            <Button size="sm" variant="destructive" onClick={() => cancelMutation.mutate(a.id)}>
                              <XCircle className="h-3 w-3 mr-1" />Cancelar
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" title="Excluir" onClick={() => handleDelete(a.id, a.title)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum agendamento encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reminders */}
      {tab === 'reminders' && (
        <Card>
          <CardHeader><CardTitle>Lembretes Pendentes</CardTitle></CardHeader>
          <CardContent>
            {loadingReminders ? <p className="text-muted-foreground">Carregando...</p> : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titulo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allReminders.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>{a.customer?.name || '-'}</TableCell>
                      <TableCell>{new Date(a.startsAt).toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{a.location || '-'}</TableCell>
                      <TableCell>{apptStatusBadge(a.status)}</TableCell>
                    </TableRow>
                  ))}
                  {allReminders.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum lembrete pendente</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Contagem por Status</CardTitle></CardHeader>
            <CardContent>
              {loadingStats ? <p className="text-muted-foreground">Carregando...</p> : (
                <div className="space-y-3">
                  {statuses.map(s => (
                    <div key={s} className="flex items-center justify-between">
                      <span className="text-sm">{s}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, ((counts[s] || 0) / Math.max(st.total || 1, 1)) * 100)}%` }} />
                        </div>
                        <span className="text-sm font-medium">{counts[s] || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total de Agendamentos</CardTitle></CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-center">{st.total || 0}</div>
              <p className="text-center text-muted-foreground mt-2">agendamentos registrados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Appointment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <Button type="button" variant="ghost" size="icon" onClick={() => setDialogOpen(false)}><X className="h-4 w-4" /></Button>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="a-title">Titulo</Label>
              <Input id="a-title" placeholder="Titulo do agendamento" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-customer">ID do Cliente</Label>
              <Input id="a-customer" placeholder="customerId" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="a-startsAt">Inicio</Label>
                <Input id="a-startsAt" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-endsAt">Fim</Label>
                <Input id="a-endsAt" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-location">Local</Label>
              <Input id="a-location" placeholder="Local do agendamento" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>) : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
