'use client';


import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Loader2,
  FileCode,
  Search,
  Trash2,
  Eye,
  Star,
  RefreshCw,
  Plus,
  Pencil,
} from 'lucide-react';

// ── Niche options (pt-BR) ──────────────────────────────────────────

const NICHE_OPTIONS = [
  { value: '', label: 'Todos os Nichos' },
  { value: 'RETAIL', label: 'Varejo' },
  { value: 'ECOMMERCE', label: 'E-commerce' },
  { value: 'FOOD_SERVICE', label: 'Alimentação' },
  { value: 'PROFESSIONAL_SERVICES', label: 'Serviços Profissionais' },
  { value: 'HEALTH_CARE', label: 'Saúde' },
  { value: 'EDUCATION', label: 'Educação' },
  { value: 'CONSTRUCTION', label: 'Construção Civil' },
  { value: 'BEAUTY', label: 'Beleza' },
  { value: 'FITNESS', label: 'Fitness' },
  { value: 'LEGAL', label: 'Jurídico' },
  { value: 'ACCOUNTING', label: 'Contabilidade' },
  { value: 'TECH_SERVICES', label: 'Serviços de TI' },
  { value: 'REAL_ESTATE', label: 'Imobiliário' },
  { value: 'AUTOMOTIVE', label: 'Automotivo' },
  { value: 'AGRICULTURE', label: 'Agronegócio' },
  { value: 'OTHER', label: 'Outro' },
];

const NICHE_LABELS: Record<string, string> = Object.fromEntries(
  NICHE_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label]),
);

// ── Template type options (pt-BR) ──────────────────────────────────

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os Tipos' },
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'WORKFLOW', label: 'Workflow' },
  { value: 'DASHBOARD', label: 'Dashboard' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'REPORT', label: 'Relatório' },
  { value: 'INVOICE', label: 'Fatura' },
  { value: 'PRODUCT_CATALOG', label: 'Catálogo de Produtos' },
  { value: 'NICHE_SPECIFIC', label: 'Específico do Nicho' },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label]),
);

// ── Page component ─────────────────────────────────────────────────

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [nicheFilter, setNicheFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewingTemplate, setViewingTemplate] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', niche: 'RETAIL', type: 'ONBOARDING', subniche: '', isActive: true, content: '' });

  // ── Queries ──────────────────────────────────────────────────────

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get('/templates'),
  });

  // ── Mutations ────────────────────────────────────────────────────

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/templates/${id}`, { isActive }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/templates/${id}`),
    onMutate: (id) => setDeleting(id),
    onSettled: () => setDeleting(null),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setCreateDialogOpen(false);
      setForm({ name: '', description: '', niche: 'RETAIL', type: 'ONBOARDING', subniche: '', isActive: true, content: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.patch(`/templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setEditDialogOpen(false);
      setEditingTemplate(null);
    },
  });

  // ── Derived data ─────────────────────────────────────────────────

  const allTemplates = useMemo(() => {
    const raw = (templates as any)?.data ?? templates ?? [];
    if (!Array.isArray(raw)) return [];
    return raw;
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let list = allTemplates;
    if (nicheFilter) {
      list = list.filter((t: any) => t.niche === nicheFilter);
    }
    if (typeFilter) {
      list = list.filter((t: any) => t.type === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t: any) =>
          t.name?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allTemplates, nicheFilter, typeFilter, search]);

  // ── KPIs ─────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const total = allTemplates.length;
    const active = allTemplates.filter((t: any) => t.isActive !== false).length;
    const defaults = allTemplates.filter((t: any) => t.isDefault === true).length;
    const niches = new Set(allTemplates.map((t: any) => t.niche)).size;
    return { total, active, defaults, niches };
  }, [allTemplates]);

  // ── Helpers ──────────────────────────────────────────────────────

  const clearFilters = () => {
    setSearch('');
    setNicheFilter('');
    setTypeFilter('');
  };

  const hasFilters = search || nicheFilter || typeFilter;

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Templates</h1>
        <Button onClick={() => { setForm({ name: '', description: '', niche: 'RETAIL', type: 'ONBOARDING', subniche: '', isActive: true, content: '' }); setCreateDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Novo Template
        </Button>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.total}</p>
            <p className="text-xs text-muted-foreground">cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <RefreshCw className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{kpis.active}</p>
            <p className="text-xs text-muted-foreground">templates disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Padrão</CardTitle>
            <Star className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{kpis.defaults}</p>
            <p className="text-xs text-muted-foreground">templates padrão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nichos</CardTitle>
            <FileCode className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{kpis.niches}</p>
            <p className="text-xs text-muted-foreground">nichos cobertos</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Search & Filter Bar ──────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar template por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={NICHE_OPTIONS}
          value={nicheFilter}
          onChange={(e) => setNicheFilter(e.target.value)}
          className="w-full sm:w-52"
        />
        <Select
          options={TYPE_OPTIONS}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-48"
        />
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} encontrado{filteredTemplates.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Templates Grid ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum template encontrado</p>
            <p className="text-sm text-muted-foreground">
              {hasFilters
                ? 'Tente ajustar os filtros para ver mais resultados'
                : 'Nenhum template cadastrado no sistema ainda'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((t: any) => (
            <Card key={t.id} className={!t.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{t.name}</CardTitle>
                    {t.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {t.description}
                      </CardDescription>
                    )}
                  </div>
                  <Switch
                    checked={t.isActive}
                    onCheckedChange={(checked: boolean) =>
                      toggleMutation.mutate({ id: t.id, isActive: checked })
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="info">
                    {NICHE_LABELS[t.niche] || t.niche}
                  </Badge>
                  <Badge variant="outline">
                    {TYPE_LABELS[t.type] || t.type}
                  </Badge>
                  {t.isDefault && (
                    <Badge variant="warning">
                      <Star className="h-3 w-3 mr-1" />
                      Padrão
                    </Badge>
                  )}
                  {t.subniche && (
                    <Badge variant="secondary">
                      {t.subniche}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => { setEditingTemplate(t); setForm({ name: t.name, description: t.description || '', niche: t.niche, type: t.type, subniche: t.subniche || '', isActive: t.isActive, content: JSON.stringify(t.content, null, 2) }); setEditDialogOpen(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setViewingTemplate(t)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Visualizar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este template?')) {
                        deleteMutation.mutate(t.id);
                      }
                    }}
                    disabled={deleting === t.id}
                  >
                    {deleting === t.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── View Content Dialog ──────────────────────────────────── */}
      <Dialog
        open={!!viewingTemplate}
        onOpenChange={(open) => {
          if (!open) setViewingTemplate(null);
        }}
      >
        {viewingTemplate && (
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingTemplate.name}</DialogTitle>
              <DialogDescription>
                {viewingTemplate.description || 'Sem descrição'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-muted-foreground">Nicho</Label>
                  <p className="font-medium">
                    {NICHE_LABELS[viewingTemplate.niche] || viewingTemplate.niche}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="font-medium">
                    {TYPE_LABELS[viewingTemplate.type] || viewingTemplate.type}
                  </p>
                </div>
                {viewingTemplate.subniche && (
                  <div>
                    <Label className="text-muted-foreground">Subnicho</Label>
                    <p className="font-medium">{viewingTemplate.subniche}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium">
                    {viewingTemplate.isActive ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
              </div>

              {/* Content JSON */}
              <div>
                <Label className="text-muted-foreground">Conteúdo</Label>
                <pre className="mt-1 p-4 bg-muted rounded-lg text-sm overflow-x-auto font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(viewingTemplate.content, null, 2)}
                </pre>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
