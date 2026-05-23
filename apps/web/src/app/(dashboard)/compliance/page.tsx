'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
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
import { useState, useMemo } from 'react';
import { ShieldCheck, Users, CheckCircle, AlertTriangle, Clock, Plus } from 'lucide-react';

// ── Mock data ────────────────────────────────────────────────────

const mockRegistros = [
  { id: '1', profissional: 'Dra. Maria Silva', conselho: 'CRM', registro: '12345-SP', status: 'ATIVO', validade: '2027-12-31' },
  { id: '2', profissional: 'Dr. João Santos', conselho: 'CRO', registro: '67890-RJ', status: 'ATIVO', validade: '2027-06-30' },
  { id: '3', profissional: 'Dra. Ana Costa', conselho: 'CRF', registro: '54321-MG', status: 'PENDENTE', validade: '2026-08-15' },
  { id: '4', profissional: 'Dr. Pedro Oliveira', conselho: 'CRM', registro: '98765-BA', status: 'EXPIRANDO', validade: '2026-06-30' },
  { id: '5', profissional: 'Dra. Carla Mendes', conselho: 'CRO', registro: '13579-SP', status: 'ATIVO', validade: '2028-03-20' },
  { id: '6', profissional: 'Dr. Lucas Ferreira', conselho: 'CRP', registro: '24680-PR', status: 'EXPIRANDO', validade: '2026-07-10' },
  { id: '7', profissional: 'Dra. Beatriz Lima', conselho: 'CRM', registro: '11223-RS', status: 'ATIVO', validade: '2028-01-15' },
  { id: '8', profissional: 'Dr. Rafael Almeida', conselho: 'CRF', registro: '44556-PE', status: 'PENDENTE', validade: '2026-09-01' },
];

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
  const [conselhoFilter, setConselhoFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // ── Derived data ────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = mockRegistros;
    if (conselhoFilter) list = list.filter((r) => r.conselho === conselhoFilter);
    if (statusFilter) list = list.filter((r) => r.status === statusFilter);
    return list;
  }, [conselhoFilter, statusFilter]);

  const totalRegistros = mockRegistros.length;
  const ativos = mockRegistros.filter((r) => r.status === 'ATIVO').length;
  const pendentes = mockRegistros.filter((r) => r.status === 'PENDENTE').length;
  const expirando = mockRegistros.filter((r) => r.status === 'EXPIRANDO').length;

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Compliance</h1>
        <Button onClick={() => setDialogOpen(true)}>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead>Conselho</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.profissional}</TableCell>
                  <TableCell>{r.conselho}</TableCell>
                  <TableCell>{r.registro}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[r.status] || 'outline'}>
                      {statusLabel[r.status] || r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(r.validade).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Novo Registro Dialog (placeholder) ────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Registro</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground">
            <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Formulário de novo registro será implementado aqui.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
