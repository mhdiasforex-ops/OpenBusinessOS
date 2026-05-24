'use client';


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatDate } from '@openbusinessos/utils';
import { useState, useMemo } from 'react';
import { FileSignature, Search, Plus, Eye, Loader2, X, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os Status' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'EXPIRED', label: 'Expirado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const contractStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'> = {
  DRAFT: 'secondary',
  ACTIVE: 'success',
  EXPIRED: 'warning',
  CANCELLED: 'destructive',
};

const contractStatusLabel: Record<string, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

const INITIAL_CREATE_FORM = { title: '', partyName: '', value: 0, startDate: '', endDate: '', description: '' };

export default function ContractsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [editForm, setEditForm] = useState(INITIAL_CREATE_FORM);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => api.get('/contracts'),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof createForm) => api.post('/contracts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setCreateDialogOpen(false);
      setCreateForm(INITIAL_CREATE_FORM);
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => api.patch(`/contracts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setEditDialogOpen(false);
      setSelectedContract(null);
      setEditForm(INITIAL_CREATE_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/contracts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(createForm);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContract) {
      editMutation.mutate({ id: selectedContract.id, data: editForm });
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (contract: any) => {
    setSelectedContract(contract);
    setEditForm({
      title: contract.title || '',
      partyName: contract.partyName || '',
      value: contract.value || 0,
      startDate: contract.startDate ? contract.startDate.slice(0, 10) : '',
      endDate: contract.endDate ? contract.endDate.slice(0, 10) : '',
      description: contract.description || '',
    });
    setEditDialogOpen(true);
  };

  const allContracts = useMemo(() => {
    const raw = (contracts as any)?.data ?? contracts ?? [];
    if (!Array.isArray(raw)) return [];
    return raw;
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    let list = allContracts;
    if (statusFilter) list = list.filter((c: any) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c: any) =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.partyName?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allContracts, statusFilter, search]);

  const kpis = useMemo(() => {
    const total = allContracts.length;
    const active = allContracts.filter((c: any) => c.status === 'ACTIVE').length;
    const expiringSoon = allContracts.filter((c: any) => {
      if (!c.endDate) return false;
      const end = new Date(c.endDate);
      const now = new Date();
      const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    }).length;
    const draft = allContracts.filter((c: any) => c.status === 'DRAFT').length;
    return { total, active, expiringSoon, draft };
  }, [allContracts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contratos</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Contrato</DialogTitle>
            <Button type="button" variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setCreateDialogOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-title">Título</Label>
                <Input id="create-title" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-partyName">Parte</Label>
                <Input id="create-partyName" value={createForm.partyName} onChange={(e) => setCreateForm({ ...createForm, partyName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-value">Valor</Label>
                <Input id="create-value" type="number" step="0.01" value={createForm.value} onChange={(e) => setCreateForm({ ...createForm, value: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-startDate">Data de Início</Label>
                <Input id="create-startDate" type="date" value={createForm.startDate} onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-endDate">Data de Término</Label>
                <Input id="create-endDate" type="date" value={createForm.endDate} onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Descrição</Label>
              <Textarea id="create-description" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Contrato</DialogTitle>
            <Button type="button" variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setEditDialogOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título</Label>
                <Input id="edit-title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-partyName">Parte</Label>
                <Input id="edit-partyName" value={editForm.partyName} onChange={(e) => setEditForm({ ...editForm, partyName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-value">Valor</Label>
                <Input id="edit-value" type="number" step="0.01" value={editForm.value} onChange={(e) => setEditForm({ ...editForm, value: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Data de Início</Label>
                <Input id="edit-startDate" type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">Data de Término</Label>
                <Input id="edit-endDate" type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea id="edit-description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={editMutation.isPending}>
                {editMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Atualizar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contratos</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{kpis.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expirando em 30d</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{kpis.expiringSoon}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-500">{kpis.draft}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contratos..."
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
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Contratos ({filteredContracts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum contrato encontrado</div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Parte</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract: any) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.title}</TableCell>
                    <TableCell>{contract.partyName || '-'}</TableCell>
                    <TableCell>{contract.value ? `R$ ${Number(contract.value).toLocaleString('pt-BR')}` : '-'}</TableCell>
                    <TableCell className="text-sm">{contract.startDate ? formatDate(new Date(contract.startDate)) : '-'}</TableCell>
                    <TableCell className="text-sm">{contract.endDate ? formatDate(new Date(contract.endDate)) : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={contractStatusVariant[contract.status] || 'outline'}>
                        {contractStatusLabel[contract.status] || contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Ver detalhes" onClick={() => openEditDialog(contract)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Excluir" onClick={() => handleDelete(contract.id, contract.title)}>
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
    </div>
  );
}
