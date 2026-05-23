'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useState, useMemo } from 'react';
import { Calendar, Search, Plus, Clock, CheckCircle, XCircle, Bell, Users } from 'lucide-react';

export default function SchedulerPage() {
  const [tab, setTab] = useState<'appointments' | 'reminders' | 'stats'>('appointments');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agendamentos</h1>
        <Button><Plus className="h-4 w-4 mr-2" />Novo Agendamento</Button>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum agendamento encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
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
    </div>
  );
}
