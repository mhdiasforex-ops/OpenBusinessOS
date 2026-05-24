'use client';


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@openbusinessos/utils';
import { useState, useMemo } from 'react';
import { Users, UserCheck, Clock, CalendarCheck, Search, Plus, Eye, Edit, Loader2, X, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os Status' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'ON_LEAVE', label: 'De Licença' },
  { value: 'TERMINATED', label: 'Demitido' },
];

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'> = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  ON_LEAVE: 'warning',
  TERMINATED: 'destructive',
};

const statusLabel: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  ON_LEAVE: 'De Licença',
  TERMINATED: 'Demitido',
};

const DEPARTMENTS = [
  { value: '', label: 'Todos os Departamentos' },
  { value: 'Administrativo', label: 'Administrativo' },
  { value: 'Comercial', label: 'Comercial' },
  { value: 'Financeiro', label: 'Financeiro' },
  { value: 'Tecnologia', label: 'Tecnologia' },
  { value: 'RH', label: 'RH' },
  { value: 'Operações', label: 'Operações' },
];

const INITIAL_FORM = { name: '', email: '', document: '', position: '', department: '', salary: '', hireDate: '' };
const INITIAL_CREATE_FORM = { name: '', email: '', document: '', position: '', department: '', salary: 0, hireDate: '' };

export default function RhPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_CREATE_FORM);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['rh-dashboard'],
    queryFn: () => api.get('/rh/dashboard'),
  });

  const { data: employees, isLoading: empLoading } = useQuery({
    queryKey: ['rh-employees'],
    queryFn: () => api.get('/rh/employees'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/rh/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rh-employees'] });
      queryClient.invalidateQueries({ queryKey: ['rh-dashboard'] });
      setDialogOpen(false);
      setForm(INITIAL_CREATE_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/rh/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rh-employees'] });
      queryClient.invalidateQueries({ queryKey: ['rh-dashboard'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.patch(`/rh/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rh-employees'] });
      queryClient.invalidateQueries({ queryKey: ['rh-dashboard'] });
      setEditDialogOpen(false);
      setEditingId(null);
    },
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

  const dash = useMemo(() => {
    const raw = (dashboard as any)?.data ?? dashboard ?? {};
    return {
      totalEmployees: raw.totalEmployees ?? 0,
      activeEmployees: raw.activeEmployees ?? 0,
      onLeave: raw.onLeave ?? 0,
      pendingLeaves: raw.pendingLeaves ?? 0,
    };
  }, [dashboard]);

  const allEmployees = useMemo(() => {
    const raw = (employees as any)?.data ?? employees ?? [];
    if (!Array.isArray(raw)) return [];
    return raw;
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    let list = allEmployees;
    if (statusFilter) list = list.filter((e: any) => e.status === statusFilter);
    if (deptFilter) list = list.filter((e: any) => e.department === deptFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e: any) =>
          e.name?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.document?.toLowerCase().includes(q) ||
          e.position?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allEmployees, statusFilter, deptFilter, search]);

  const departments = useMemo(() => {
    const depts = new Set(allEmployees.map((e: any) => e.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [allEmployees]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">RH — Recursos Humanos</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Colaborador
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Colaborador</DialogTitle>
            <Button type="button" variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">Documento</Label>
                <Input id="document" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input id="position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input id="department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salário</Label>
                <Input id="salary" type="number" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hireDate">Data de Admissão</Label>
                <Input id="hireDate" type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} required />
              </div>
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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Colaboradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{dash.totalEmployees}</p>
            <p className="text-xs text-muted-foreground">cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{dash.activeEmployees}</p>
            <p className="text-xs text-muted-foreground">trabalhando agora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">De Licença</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{dash.onLeave}</p>
            <p className="text-xs text-muted-foreground">ferias ou licenca</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solicitacoes Pendentes</CardTitle>
            <CalendarCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{dash.pendingLeaves}</p>
            <p className="text-xs text-muted-foreground">aguardando aprovacao</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">Todos os Departamentos</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela de Colaboradores */}
      <Card>
        <CardHeader>
          <CardTitle>Colaboradores ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {empLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum colaborador encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Salario</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admissao</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp: any) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{emp.email}</TableCell>
                    <TableCell>{formatCurrency(Number(emp.salary ?? 0))}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[emp.status] || 'outline'}>
                        {statusLabel[emp.status] || emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {emp.hireDate ? formatDate(new Date(emp.hireDate)) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Ver detalhes" onClick={() => { setEditingId(emp.id); setEditForm({ name: emp.name, email: emp.email, document: emp.document || '', position: emp.position || '', department: emp.department || '', salary: String(emp.salary || ''), hireDate: emp.hireDate ? emp.hireDate.slice(0, 10) : '' }); setEditDialogOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Editar" onClick={() => { setEditingId(emp.id); setEditForm({ name: emp.name, email: emp.email, document: emp.document || '', position: emp.position || '', department: emp.department || '', salary: String(emp.salary || ''), hireDate: emp.hireDate ? emp.hireDate.slice(0, 10) : '' }); setEditDialogOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Excluir" onClick={() => handleDelete(emp.id, emp.name)}>
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Colaborador</DialogTitle>
            <Button type="button" variant="ghost" size="icon" onClick={() => setEditDialogOpen(false)}><X className="h-4 w-4" /></Button>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (editingId) updateMutation.mutate({ id: editingId, data: { ...editForm, salary: parseFloat(editForm.salary as any) || 0 } }); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="e-name">Nome</Label>
              <Input id="e-name" value={(editForm as any).name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="e-email">Email</Label>
                <Input id="e-email" type="email" value={(editForm as any).email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-document">Documento</Label>
                <Input id="e-document" value={(editForm as any).document} onChange={(e) => setEditForm({ ...editForm, document: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-position">Cargo</Label>
                <Input id="e-position" value={(editForm as any).position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-department">Departamento</Label>
                <Input id="e-department" value={(editForm as any).department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-salary">Salario</Label>
                <Input id="e-salary" type="number" step="0.01" value={(editForm as any).salary} onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-hireDate">Data de Admissao</Label>
                <Input id="e-hireDate" type="date" value={(editForm as any).hireDate} onChange={(e) => setEditForm({ ...editForm, hireDate: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>) : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
