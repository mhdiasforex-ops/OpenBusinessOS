'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { CreditCard, DollarSign, TrendingDown, Wallet, Plus, Loader2, Trash2, RotateCcw } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────

interface PaymentConfig {
 id: string;
 provider: string;
 isActive: boolean;
}

interface Payment {
 id: string;
 amount: number;
 status: string;
 method: string;
 description: string;
 dueDate: string;
 paidAt: string | null;
 customer?: { name: string } | null;
 createdAt: string;
}

interface PaymentStats {
 totalConfirmed: number;
 totalPending: number;
 totalCancelled: number;
 totalRefunded: number;
 fees: number;
 net: number;
}

// ── Status badge helpers ─────────────────────────────────────────

const statusLabel: Record<string, string> = {
 PAID: 'Confirmado',
 PENDING: 'Pendente',
 CANCELLED: 'Cancelado',
 OVERDUE: 'Vencido',
 REFUNDED: 'Estornado',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
 PAID: 'default',
 PENDING: 'secondary',
 CANCELLED: 'destructive',
 OVERDUE: 'destructive',
 REFUNDED: 'outline',
};

// ── Filter options ───────────────────────────────────────────────

const statusOptions = [
 { value: '', label: 'Todos os status' },
 { value: 'PAID', label: 'Confirmado' },
 { value: 'PENDING', label: 'Pendente' },
 { value: 'CANCELLED', label: 'Cancelado' },
 { value: 'OVERDUE', label: 'Vencido' },
 { value: 'REFUNDED', label: 'Estornado' },
];

const methodOptions = [
 { value: '', label: 'Todos os métodos' },
 { value: 'PIX', label: 'PIX' },
 { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
 { value: 'DEBIT_CARD', label: 'Cartão de Débito' },
 { value: 'BOLETO', label: 'Boleto' },
 { value: 'BANK_TRANSFER', label: 'Transferência' },
];

// ── New Payment Form ──────────────────────────────────────────────

function NewPaymentForm({ onClose }: { onClose: () => void }) {
 const queryClient = useQueryClient();
 const [form, setForm] = useState({ description: '', amount: '', method: 'PIX', dueDate: '' });

 const createMutation = useMutation({
  mutationFn: (data: any) => api.post('/payment', data),
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['payments'] });
   queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
   onClose();
  },
 });

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  createMutation.mutate({
   description: form.description,
   amount: parseFloat(form.amount),
   method: form.method,
   dueDate: form.dueDate,
   type: 'INCOME',
   category: 'PAYMENT',
  });
 };

 return (
  <form onSubmit={handleSubmit} className="space-y-4">
   <div className="space-y-2">
    <Label>Descrição</Label>
    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
   </div>
   <div className="space-y-2">
    <Label>Valor (R$)</Label>
    <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
   </div>
   <div className="space-y-2">
    <Label>Método</Label>
    <Select
     options={methodOptions.filter((m) => m.value)}
     value={form.method}
     onChange={(e) => setForm({ ...form, method: e.target.value })}
    />
   </div>
   <div className="space-y-2">
    <Label>Data de Vencimento</Label>
    <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
   </div>
   <div className="flex justify-end gap-2 pt-4">
    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
    <Button type="submit" disabled={createMutation.isPending}>
     {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
     Criar Cobrança
    </Button>
   </div>
  </form>
 );
}

// ── Page component ───────────────────────────────────────────────

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
 const [dialogOpen, setDialogOpen] = useState(false);

 // ── Queries ────────────────────────────────────────────────────

 const { data: payments = [], isLoading } = useQuery<Payment[]>({
  queryKey: ['payments'],
  queryFn: () => api.get('/payment'),
 });

 const { data: stats } = useQuery<PaymentStats>({
  queryKey: ['payment-stats'],
  queryFn: () => api.get('/payment/stats'),
 });

 const { data: configs = [] } = useQuery<PaymentConfig[]>({
  queryKey: ['payment-configs'],
  queryFn: () => api.get('/payment/configs'),
 });

 // ── Mutations ────────────────────────────────────────────────────

 const cancelMutation = useMutation({
   mutationFn: (id: string) => api.post(`/payment/${id}/cancel`),
   onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
   },
  });

  const refundMutation = useMutation({
   mutationFn: (id: string) => api.post(`/payment/${id}/refund`),
   onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
   },
  });

  const deleteMutation = useMutation({
   mutationFn: (id: string) => api.delete(`/payment/${id}`),
   onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
   },
  });

 // ── Derived data ────────────────────────────────────────────────

 const filtered = useMemo(() => {
  let list = payments;
  if (statusFilter) list = list.filter((p) => p.status === statusFilter);
  return list;
 }, [payments, statusFilter]);

 const totalConfirmado = stats?.totalConfirmed ?? payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
 const taxas = stats?.fees ?? 0;
 const liquido = stats?.net ?? totalConfirmado - taxas;

 // ── Render ──────────────────────────────────────────────────────

 return (
  <div className="space-y-6">
   <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold">Pagamentos</h1>
    <Button onClick={() => setDialogOpen(true)}>
     <Plus className="h-4 w-4 mr-2" />
     Nova Cobrança
    </Button>
   </div>

   {/* ── Config Warning ─────────────────────────────────────── */}
   {configs.length === 0 && (
    <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950">
     <CardContent className="pt-6">
      <p className="text-sm text-yellow-700 dark:text-yellow-300">
       Nenhuma configuração de pagamento ativa. Configure um gateway de pagamento nas Configurações.
      </p>
     </CardContent>
    </Card>
   )}

   {/* ── KPI Cards ────────────────────────────────────────────── */}
   <div className="grid gap-4 md:grid-cols-3">
    <Card>
     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">Total Confirmado</CardTitle>
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
      <CardTitle className="text-sm font-medium text-muted-foreground">Taxas</CardTitle>
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
      <CardTitle className="text-sm font-medium text-muted-foreground">Líquido</CardTitle>
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
     <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
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
     {isLoading ? (
      <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
     ) : (
      <div className="overflow-x-auto">
      <Table>
       <TableHeader>
        <TableRow>
         <TableHead>Descrição</TableHead>
         <TableHead>Método</TableHead>
         <TableHead className="text-right">Valor</TableHead>
         <TableHead>Status</TableHead>
         <TableHead>Vencimento</TableHead>
         <TableHead>Ações</TableHead>
        </TableRow>
       </TableHeader>
       <TableBody>
        {filtered.map((p) => (
         <TableRow key={p.id}>
          <TableCell className="font-medium">{p.description}</TableCell>
          <TableCell>{p.method}</TableCell>
          <TableCell className="text-right font-medium">
           R$ {Number(p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </TableCell>
          <TableCell>
           <Badge variant={statusVariant[p.status] || 'outline'}>
            {statusLabel[p.status] || p.status}
           </Badge>
          </TableCell>
          <TableCell>
            {p.dueDate ? new Date(p.dueDate).toLocaleDateString('pt-BR') : '—'}
          </TableCell>
           <TableCell>
             <div className="flex gap-1">
               {(p.status === 'PENDING' || p.status === 'OVERDUE') && (
                 <Button size="sm" variant="destructive" onClick={() => cancelMutation.mutate(p.id)}>
                   <Trash2 className="h-3 w-3 mr-1" /> Cancelar
                 </Button>
               )}
               {p.status === 'PAID' && (
                 <Button size="sm" variant="outline" onClick={() => refundMutation.mutate(p.id)}>
                   <RotateCcw className="h-3 w-3 mr-1" /> Estornar
                 </Button>
               )}
               <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { if (confirm('Excluir permanentemente este pagamento?')) deleteMutation.mutate(p.id); }}>
                 <Trash2 className="h-3 w-3" />
               </Button>
             </div>
           </TableCell>
         </TableRow>
        ))}
        {filtered.length === 0 && (
         <TableRow>
          <TableCell colSpan={6} className="text-center text-muted-foreground">
           Nenhum pagamento encontrado
          </TableCell>
         </TableRow>
        )}
       </TableBody>
      </Table>
      </div>
     )}
    </CardContent>
   </Card>

   {/* ── Nova Cobranca Dialog ──────────────────────────────────── */}
   <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>Nova Cobrança</DialogTitle>
     </DialogHeader>
     <NewPaymentForm onClose={() => setDialogOpen(false)} />
    </DialogContent>
   </Dialog>
  </div>
 );
}
