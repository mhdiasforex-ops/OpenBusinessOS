'use client';


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useState, useMemo } from 'react';
import { ShieldCheck, Users, CheckCircle, AlertTriangle, Clock, Plus, Loader2, Trash2 } from 'lucide-react';
import { formatDate } from '@openbusinessos/utils';

// ── Status badge helpers ─────────────────────────────────────────

const statusLabel: Record<string, string> = {
  ATIVO: 'Ativo',
  PENDENTE: 'Pendente',
  EXPIRANDO: 'Expirando',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ATIVO: 'default',
  PENDENTE: 'secondary',
  EXPIRANDO: 'destructive',
};

// ── Filter options ───────────────────────────────────────────────

const conselhoOptions = [
  { value: '', label: 'Todos os conselhos' },
  { value: 'CRM', label: 'CRM' },
  { value: 'CRO', label: 'CRO' },
  { value: 'CRF', label: 'CRF' },
  { value: 'CRP', label: 'CRP' },
];

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EXPIRANDO', label: 'Expirando' },
];

// ── Page component ───────────────────────────────────────────────

export default function CompliancePage() {
  const queryClient = useQueryClient();
  const [conselhoFilter, setConselhoFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    profissional: '',
    conselho: 'CRM',
    registro: '',
    validade: '',
  });

  // ── Queries ──────────────────────────────────────────────────────

  const { data: registros, isLoading } = useQuery({
    queryKey: ['compliance'],
    queryFn: () => api.get('/compliance'),
  });

  // ── Mutations ────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/compliance', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
      setDialogOpen(false);
      setForm({ profissional: '', conselho: 'CRM', registro: '', validade: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/compliance/records/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
    },
  });

  // ── Derived data ────────────────────────────────────────────────

  const allRegistros = useMemo(() => {
    const raw = (registros as any)?.data ?? registros ?? [];
    if (!Array.isArray(raw)) return [];
    return raw;
  }, [registros]);

  const filtered = useMemo(() => {
    let list = allRegistros;
    if (conselhoFilter) list = list.filter((r: any) => r.conselho === conselhoFilter);
    if (statusFilter) list = list.filter((r: any) => r.status === statusFilter);
    return list;
  }, [allRegistros, conselhoFilter, statusFilter]);

  const totalRegistros = allRegistros.length;
  const ativos = allRegistros.filter((r: any) => r.status === 'ATIVO').length;
  const pendentes = allRegistros.filter((r: any) => r.status === 'PENDENTE').length;
  const expirando = allRegistros.filter((r: any) => r.status === 'EXPIRANDO').length;

  // ── Handlers ──────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      profissional: form.profissional,
      conselho: form.conselho,
      registro: form.registro,
      validade: form.validade,
    });
  };

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Compliance</h1>
        <Button onClick={() => { setForm({ profissional: '', conselho: 'CRM', registro: '', validade: '' }); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Registro
        </Button>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Registros
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRegistros}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{ativos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{pendentes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expirando
            </CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{expirando}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="w-[180px]">
          <Select
            options={conselhoOptions}
            value={conselhoFilter}
            onChange={(e) => setConselhoFilter(e.target.value)}
          />
        </div>
        <div className="w-[180px]">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* ── Registros Table ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Registros Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">Carregando registros...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Conselho</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.profissional}</TableCell>
                    <TableCell>{r.conselho}</TableCell>
                    <TableCell>{r.registro}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[r.status] || 'outline'}>
                        {statusLabel[r.status] || r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.validade ? formatDate(r.validade) : '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Excluir registro de ${r.profissional}?`)) {
                            deleteMutation.mutate(r.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Novo Registro Dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Registro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-profissional">Profissional</Label>
              <Input
                id="c-profissional"
                placeholder="Nome do profissional"
                value={form.profissional}
                onChange={(e) => setForm({ ...form, profissional: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-conselho">Conselho</Label>
                <Select
                  id="c-conselho"
                  options={conselhoOptions.filter((o) => o.value !== '')}
                  value={form.conselho}
                  onChange={(e) => setForm({ ...form, conselho: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-registro">Nº Registro</Label>
                <Input
                  id="c-registro"
                  placeholder="Ex: 12345-SP"
                  value={form.registro}
                  onChange={(e) => setForm({ ...form, registro: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-validade">Validade</Label>
              <Input
                id="c-validade"
                type="date"
                value={form.validade}
                onChange={(e) => setForm({ ...form, validade: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Registro'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
