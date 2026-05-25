'use client';


import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, LayoutTemplate, FileText, Image, Plus, Trash2, Pencil, Globe, Eye, EyeOff } from 'lucide-react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CmsPage() {
  const queryClient = useQueryClient();
  const [deletingPage, setDeletingPage] = useState<string | null>(null);
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null);
  const [showNewPageDialog, setShowNewPageDialog] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');

  // Pages query
  const { data: pagesData, isLoading: pagesLoading } = useQuery({
    queryKey: ['cms-pages'],
    queryFn: () => api.get('/cms/pages'),
  });

  // Media query
  const { data: mediaData, isLoading: mediaLoading } = useQuery({
    queryKey: ['cms-media'],
    queryFn: () => api.get('/cms/media'),
  });

  // Create page mutation
  const createPageMutation = useMutation({
    mutationFn: (data: { title: string; slug: string }) => api.post('/cms/pages', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      setShowNewPageDialog(false);
      setNewPageTitle('');
      setNewPageSlug('');
      setSlugManuallyEdited(false);
    },
  });

  // Update page (publish/unpublish) mutation
  const updatePageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/cms/pages/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cms-pages'] }),
  });

  // Delete page mutation
  const deletePageMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cms/pages/${id}`),
    onMutate: (id) => setDeletingPage(id),
    onSettled: () => setDeletingPage(null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cms-pages'] }),
  });

  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cms/media/${id}`),
    onMutate: (id) => setDeletingMedia(id),
    onSettled: () => setDeletingMedia(null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cms-media'] }),
  });

  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.upload('/cms/media/upload', formData);
      queryClient.invalidateQueries({ queryKey: ['cms-media'] });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const pages: any[] = pagesData?.data || pagesData || [];
  const media: any[] = mediaData?.data || mediaData || [];

  const publishedCount = pages.filter((p: any) => p.status === 'PUBLISHED').length;
  const draftCount = pages.filter((p: any) => p.status === 'DRAFT').length;

  const handleTitleChange = (value: string) => {
    setNewPageTitle(value);
    if (!slugManuallyEdited) {
      setNewPageSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setNewPageSlug(slugify(value));
    setSlugManuallyEdited(true);
  };

  const togglePublish = (page: any) => {
    const newStatus = page.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const data: any = { status: newStatus };
    if (newStatus === 'PUBLISHED') {
      data.publishedAt = new Date().toISOString();
    } else {
      data.publishedAt = null;
    }
    updatePageMutation.mutate({ id: page.id, data });
  };

  const kpis = [
    { title: 'Total de Páginas', value: pages.length, icon: FileText },
    { title: 'Publicadas', value: publishedCount, icon: Globe },
    { title: 'Rascunhos', value: draftCount, icon: FileText },
    { title: 'Mídias', value: media.length, icon: Image },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">CMS</h1>
        <Button onClick={() => setShowNewPageDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />Nova Página
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="paginas">
        <TabsList>
          <TabsTrigger value="paginas">
            <FileText className="h-4 w-4 mr-2" />
            Páginas
          </TabsTrigger>
          <TabsTrigger value="midia">
            <Image className="h-4 w-4 mr-2" />
            Mídia
          </TabsTrigger>
        </TabsList>

        {/* Páginas Tab */}
        <TabsContent value="paginas">
          {pagesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <LayoutTemplate className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhuma página criada</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie sua primeira página de conteúdo para começar
                </p>
                <Button onClick={() => setShowNewPageDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />Criar Página
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Publicado em</TableHead>
                    <TableHead>Atualizado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page: any) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">{page.title}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{page.slug}</code>
                      </TableCell>
                      <TableCell>
                        {page.status === 'PUBLISHED' ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Publicado</Badge>
                        ) : (
                          <Badge variant="outline">Rascunho</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {page.publishedAt ? formatDate(page.publishedAt) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(page.updatedAt || page.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePublish(page)}
                            disabled={updatePageMutation.isPending}
                            title={page.status === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}
                          >
                            {page.status === 'PUBLISHED' ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => { setEditingPage(page); setEditTitle(page.title); setEditSlug(page.slug); }}>
                            <Pencil className="h-3 w-3" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Excluir esta página? Esta ação não pode ser desfeita.')) {
                                deletePageMutation.mutate(page.id);
                              }
                            }}
                            disabled={deletingPage === page.id}
                          >
                            {deletingPage === page.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Mídia Tab */}
        <TabsContent value="midia">
          {mediaLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : media.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Image className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhuma mídia enviada</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Faça upload de imagens e arquivos para usar nas suas páginas
                </p>
                <Label htmlFor="media-upload-empty" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>
                      {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                      Upload Mídia
                    </span>
                  </Button>
                  <Input id="media-upload-empty" type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                </Label>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Mídia</CardTitle>
                <Label htmlFor="media-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                      Upload
                    </span>
                  </Button>
                  <Input id="media-upload" type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                </Label>
              </CardHeader>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prévia</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {media.map((item: any) => {
                    const isImage = item.mimeType?.startsWith('image/');
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {isImage ? (
                            <img
                              src={item.url}
                              alt={item.alt || item.originalName}
                              className="h-10 w-10 rounded object-cover border"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{item.originalName || item.filename}</p>
                            {item.alt && (
                              <p className="text-xs text-muted-foreground">{item.alt}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.mimeType}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatFileSize(item.size)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Excluir esta mídia? Esta ação não pode ser desfeita.')) {
                                deleteMediaMutation.mutate(item.id);
                              }
                            }}
                            disabled={deletingMedia === item.id}
                          >
                            {deletingMedia === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Editar Página Dialog */}
      <Dialog open={!!editingPage} onOpenChange={(open) => { if (!open) setEditingPage(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Página</DialogTitle>
            <DialogDescription>Altere o título ou slug da página.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-title">Título</Label>
              <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-slug">Slug</Label>
              <Input id="edit-slug" value={editSlug} onChange={(e) => setEditSlug(slugify(e.target.value))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditingPage(null)}>Cancelar</Button>
              <Button
                onClick={() => {
                  if (editingPage) {
                    updatePageMutation.mutate({ id: editingPage.id, data: { title: editTitle, slug: editSlug } });
                    setEditingPage(null);
                  }
                }}
                disabled={!editTitle.trim() || !editSlug.trim() || updatePageMutation.isPending}
              >
                {updatePageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nova Página Dialog */}
      <Dialog open={showNewPageDialog} onOpenChange={setShowNewPageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Página</DialogTitle>
            <DialogDescription>Crie uma nova página de conteúdo para o seu site.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="page-title">Título</Label>
              <Input
                id="page-title"
                value={newPageTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ex: Sobre Nós"
              />
            </div>
            <div>
              <Label htmlFor="page-slug">Slug</Label>
              <Input
                id="page-slug"
                value={newPageSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="sobre-nos"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O slug é gerado automaticamente a partir do título. Você pode editá-lo manualmente.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowNewPageDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => createPageMutation.mutate({ title: newPageTitle, slug: newPageSlug })}
                disabled={!newPageTitle.trim() || !newPageSlug.trim() || createPageMutation.isPending}
              >
                {createPageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Criar Página
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
