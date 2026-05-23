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
import { CreditCard, DollarSign, TrendingDown, Wallet, Plus } from 'lucide-react';

// ── Mock data ────────────────────────────────────────────────────

const mockPayments = [
  { id: '1', cliente: 'Maria Silva', metodo: 'PIX', valor: 1500.0, status: 'CONFIRMADO', data: '2026-05-20' },
  { id: '2', cliente: 'João Santos', metodo: 'Cartão', valor: 320.5, status: 'PENDENTE', data: '2026-05-19' },
  { id: '3', cliente: 'Ana Costa', metodo: 'Boleto', valor: 890.0, status: 'CONFIRMADO', data: '2026-05-18' },
  { id: '4', cliente: 'Pedro Oliveira', metodo: 'PIX', valor: 2100.0, status: 'CANCELADO', data: '2026-05-17' },
  { id: '5', cliente: 'Carla Mendes', metodo: 'Transferência', valor: 4500.0, status: 'CONFIRMADO', data: '2026-05-16' },
  { id: '6', cliente: 'Lucas Ferreira', metodo: 'Cartão', valor: 175.9, status: 'ESTORNADO', data: '2026-05-15' },
  { id: '7', cliente: 'Beatriz Lima', metodo: 'PIX', valor: 600.0, status: 'CONFIRMADO', data: '2026-05-14' },
  { id: '8', cliente: 'Rafael Almeida', metodo: 'Boleto', valor: 1250.0, status: 'PENDENTE', data: '2026-05-13' },
];

// ── Status badge helpers ─────────────────────────────────────────

const statusLabel: Record<string, string> = {
  CONFIRMADO: 'Confirmado',
  PENDENTE: 'Pendente',
  CANCELADO: 'Cancelado',
  ESTORNADO: 'Estornado',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CONFIRMADO: 'default',
  PENDENTE: 'secondary',
  CANCELADO: 'destructive',
  ESTORNADO: 'outline',
};

// ── Filter options ───────────────────────────────────────────────

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'ESTORNADO', label: 'Estornado' },
];

const metodoOptions = [
  { value: '', label: 'Todos os métodos' },
  { value: 'PIX', label: 'PIX' },
  { value: 'Cartão', label: 'Cartão' },
  { value: 'Boleto', label: 'Boleto' },
  { value: 'Transferência', label: 'Transferência' },
];

// ── Page component ───────────────────────────────────────────────

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [metodoFilter, setMetodoFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // ── Derived data ────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = mockPayments;
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (metodoFilter) list = list.filter((p) => p.metodo === metodoFilter);
    return list;
  }, [statusFilter, metodoFilter]);

  const totalConfirmado = mockPayments
    .filter((p) => p.status === 'CONFIRMADO')
    .reduce((sum, p) => sum + p.valor, 0);

  const taxas = mockPayments
    .filter((p) => p.status === 'CONFIRMADO')
    .reduce((sum, p) => {
      const taxa = p.metodo === 'Cartão' ? p.valor * 0.03 : p.metodo === 'Boleto' ? 3.5 : 0;
      return sum + taxa;
    }, 0);

  const liquido = totalConfirmado - taxas;

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pagamentos</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Cobrança
        </Button>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Confirmado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              R$ {totalConfirmado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxas
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              R$ {taxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Líquido
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              R$ {liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="w-[180px]">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <div className="w-[180px]">
          <Select
            options={metodoOptions}
            value={metodoFilter}
            onChange={(e) => setMetodoFilter(e.target.value)}
          />
        </div>
      </div>

      {/* ── Payments Table ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.cliente}</TableCell>
                  <TableCell>{p.metodo}</TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[p.status] || 'outline'}>
                      {statusLabel[p.status] || p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(p.data).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum pagamento encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Nova Cobranca Dialog (placeholder) ────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Cobrança</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Formulário de nova cobrança será implementado aqui.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
