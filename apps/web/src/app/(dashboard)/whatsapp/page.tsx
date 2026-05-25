'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MessageCircle, Wifi, WifiOff, FileCode, ArrowUpRight, ArrowDownLeft, Loader2, Plus, Trash2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────

interface WhatsAppConfig {
 id: string;
 name: string;
 phone: string;
 provider: string;
 isActive: boolean;
 createdAt: string;
}

interface WhatsAppTemplate {
 id: string;
 name: string;
 category: string;
 status: string;
 content: string;
 createdAt: string;
}

interface WhatsAppMessage {
 id: string;
 from: string;
 to: string;
 direction: string;
 status: string;
 content: string;
 createdAt: string;
}

// ── Badge helpers ────────────────────────────────────────────────

const conexaoStatusVariant: Record<string, 'default' | 'destructive'> = {
 ACTIVE: 'default',
 INACTIVE: 'destructive',
 CONNECTED: 'default',
 DISCONNECTED: 'destructive',
};

const conexaoStatusLabel: Record<string, string> = {
 ACTIVE: 'Conectado',
 INACTIVE: 'Desconectado',
 CONNECTED: 'Conectado',
 DISCONNECTED: 'Desconectado',
};

const templateStatusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
 APPROVED: 'default',
 PENDING: 'secondary',
 REJECTED: 'destructive',
};

const templateStatusLabel: Record<string, string> = {
 APPROVED: 'Aprovado',
 PENDING: 'Pendente',
 REJECTED: 'Rejeitado',
};

const msgStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
 DELIVERED: 'default',
 SENT: 'secondary',
 READ: 'outline',
 FAILED: 'destructive',
};

const msgStatusLabel: Record<string, string> = {
 DELIVERED: 'Entregue',
 SENT: 'Enviado',
 READ: 'Lido',
 FAILED: 'Falhou',
};

// ── New Config Form ──────────────────────────────────────────────

function NewConfigForm({ onClose }: { onClose: () => void }) {
 const queryClient = useQueryClient();
 const [form, setForm] = useState({ name: '', phone: '', provider: 'evolution-api', apiKey: '', apiUrl: '' });

 const createMutation = useMutation({
  mutationFn: (data: any) => api.post('/whatsapp/configs', data),
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['whatsapp-configs'] });
   onClose();
  },
 });

 return (
  <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
   <div className="space-y-2">
    <Label>Nome da Instância</Label>
    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Clínica Principal" />
   </div>
   <div className="space-y-2">
    <Label>Telefone</Label>
    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="+55 11 99999-0000" />
   </div>
   <div className="space-y-2">
    <Label>API Key</Label>
    <Input type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} required />
   </div>
   <div className="space-y-2">
    <Label>API URL</Label>
    <Input value={form.apiUrl} onChange={(e) => setForm({ ...form, apiUrl: e.target.value })} placeholder="https://evolution-api.example.com" />
   </div>
   <div className="flex justify-end gap-2 pt-4">
    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
    <Button type="submit" disabled={createMutation.isPending}>
     {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
     Conectar
    </Button>
   </div>
  </form>
 );
}

// ── New Template Form ────────────────────────────────────────────

function NewTemplateForm({ onClose }: { onClose: () => void }) {
 const queryClient = useQueryClient();
 const [form, setForm] = useState({ name: '', category: 'UTILITY', content: '' });

 const createMutation = useMutation({
  mutationFn: (data: any) => api.post('/whatsapp/templates', data),
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
   onClose();
  },
 });

 return (
  <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
   <div className="space-y-2">
    <Label>Nome do Template</Label>
    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
   </div>
   <div className="space-y-2">
    <Label>Categoria</Label>
    <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
     <option value="UTILITY">Utilidade</option>
     <option value="MARKETING">Marketing</option>
     <option value="AUTHENTICATION">Autenticação</option>
    </select>
   </div>
   <div className="space-y-2">
    <Label>Conteúdo</Label>
    <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required rows={4} placeholder="Olá {{1}}, sua consulta está confirmada..." />
   </div>
   <div className="flex justify-end gap-2 pt-4">
    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
    <Button type="submit" disabled={createMutation.isPending}>
     {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
     Criar Template
    </Button>
   </div>
  </form>
 );
}

// ── Page component ───────────────────────────────────────────────

export default function WhatsAppPage() {
 const queryClient = useQueryClient();
 const [configDialogOpen, setConfigDialogOpen] = useState(false);
 const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

 // ── Queries ────────────────────────────────────────────────────

 const { data: configsData, isLoading: configsLoading } = useQuery<{ data: WhatsAppConfig[] }>({
  queryKey: ['whatsapp-configs'],
  queryFn: () => api.get('/whatsapp/configs'),
 });

 const { data: templatesData, isLoading: templatesLoading } = useQuery<{ data: WhatsAppTemplate[] }>({
  queryKey: ['whatsapp-templates'],
  queryFn: () => api.get('/whatsapp/templates'),
 });

 const { data: messagesData, isLoading: messagesLoading } = useQuery<{ data: WhatsAppMessage[] }>({
   queryKey: ['whatsapp-messages'],
   queryFn: () => api.get('/whatsapp/messages'),
  });

  const deleteConfigMutation = useMutation({
   mutationFn: (id: string) => api.delete(`/whatsapp/configs/${id}`),
   onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-configs'] }),
  });

  const deleteTemplateMutation = useMutation({
   mutationFn: (id: string) => api.delete(`/whatsapp/templates/${id}`),
   onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] }),
  });

  const configs = configsData?.data || [];
 const templates = templatesData?.data || [];
 const messages = messagesData?.data || [];

 const activeConfigs = configs.filter((c) => c.isActive).length;

 return (
  <div className="space-y-6">
   <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold">WhatsApp</h1>
    {activeConfigs > 0 && (
     <Button onClick={() => setTemplateDialogOpen(true)}>
      <Plus className="h-4 w-4 mr-2" /> Novo Template
     </Button>
    )}
   </div>

   <Tabs defaultValue="conexoes">
    <TabsList>
     <TabsTrigger value="conexoes">Conexões ({configs.length})</TabsTrigger>
     <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
     <TabsTrigger value="mensagens">Mensagens ({messages.length})</TabsTrigger>
    </TabsList>

    {/* ── Tab: Conexões ──────────────────────────────────────── */}
    <TabsContent value="conexoes">
     <Card>
      <CardHeader className="flex flex-row items-center justify-between">
       <CardTitle className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" /> Conexões
       </CardTitle>
       <Button size="sm" onClick={() => setConfigDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-2" /> Nova Conexão
       </Button>
      </CardHeader>
      <CardContent>
       {configsLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
       ) : configs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
         <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
         <p>Nenhuma conexão configurada. Clique em "Nova Conexão" para começar.</p>
        </div>
       ) : (
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
           <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead className="text-right">Ações</TableHead>
           </TableRow>
          </TableHeader>
          <TableBody>
           {configs.map((c) => (
            <TableRow key={c.id}>
             <TableCell className="font-medium">{c.name}</TableCell>
             <TableCell>{c.phone}</TableCell>
             <TableCell>
              <Badge variant={conexaoStatusVariant[c.isActive ? 'ACTIVE' : 'INACTIVE']}>
               {c.isActive ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
               {c.isActive ? 'Conectado' : 'Desconectado'}
              </Badge>
             </TableCell>
             <TableCell>{c.provider}</TableCell>
             <TableCell className="text-right">
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { if (confirm(`Desconectar ${c.name}?`)) deleteConfigMutation.mutate(c.id); }}>
               <Trash2 className="h-3 w-3" />
              </Button>
             </TableCell>
            </TableRow>
           ))}
         </TableBody>
        </Table>
        </div>
       )}
      </CardContent>
     </Card>
    </TabsContent>

    {/* ── Tab: Templates ─────────────────────────────────────── */}
    <TabsContent value="templates">
     <Card>
      <CardHeader>
       <CardTitle className="flex items-center gap-2">
        <FileCode className="h-5 w-5" /> Templates
       </CardTitle>
      </CardHeader>
      <CardContent>
       {templatesLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
       ) : templates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
         <p>Nenhum template cadastrado.</p>
        </div>
       ) : (
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
           <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
           </TableRow>
          </TableHeader>
          <TableBody>
           {templates.map((t) => (
            <TableRow key={t.id}>
             <TableCell className="font-medium">{t.name}</TableCell>
             <TableCell>{t.category}</TableCell>
             <TableCell>
              <Badge variant={templateStatusVariant[t.status] || 'secondary'}>
               {templateStatusLabel[t.status] || t.status}
              </Badge>
             </TableCell>
             <TableCell className="text-right">
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { if (confirm(`Excluir template ${t.name}?`)) deleteTemplateMutation.mutate(t.id); }}>
               <Trash2 className="h-3 w-3" />
              </Button>
             </TableCell>
            </TableRow>
           ))}
         </TableBody>
        </Table>
        </div>
       )}
      </CardContent>
     </Card>
    </TabsContent>

    {/* ── Tab: Mensagens ─────────────────────────────────────── */}
    <TabsContent value="mensagens">
     <Card>
      <CardHeader>
       <CardTitle className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" /> Mensagens Recentes
       </CardTitle>
      </CardHeader>
      <CardContent>
       {messagesLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
       ) : messages.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
         <p>Nenhuma mensagem registrada.</p>
        </div>
       ) : (
        <div className="overflow-x-auto">
        <Table>
         <TableHeader>
          <TableRow>
           <TableHead>De / Para</TableHead>
           <TableHead>Direção</TableHead>
           <TableHead>Status</TableHead>
           <TableHead>Conteúdo</TableHead>
           <TableHead>Data</TableHead>
          </TableRow>
         </TableHeader>
         <TableBody>
          {messages.map((m) => (
           <TableRow key={m.id}>
            <TableCell className="font-medium">{m.direction === 'INBOUND' ? m.from : m.to}</TableCell>
            <TableCell>
             <span className="flex items-center gap-1">
              {m.direction === 'INBOUND' ? (
               <ArrowDownLeft className="h-4 w-4 text-green-500" />
              ) : (
               <ArrowUpRight className="h-4 w-4 text-blue-500" />
              )}
              {m.direction === 'INBOUND' ? 'Recebida' : 'Enviada'}
             </span>
            </TableCell>
            <TableCell>
             <Badge variant={msgStatusVariant[m.status] || 'outline'}>
              {msgStatusLabel[m.status] || m.status}
             </Badge>
            </TableCell>
            <TableCell className="max-w-[250px] truncate">{m.content}</TableCell>
            <TableCell>{new Date(m.createdAt).toLocaleString('pt-BR')}</TableCell>
           </TableRow>
          ))}
         </TableBody>
        </Table>
        </div>
       )}
      </CardContent>
     </Card>
    </TabsContent>
   </Tabs>

   {/* ── Dialogs ────────────────────────────────────────────────── */}
   <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
    <DialogContent className="max-w-md">
     <DialogHeader><DialogTitle>Nova Conexão WhatsApp</DialogTitle></DialogHeader>
     <NewConfigForm onClose={() => setConfigDialogOpen(false)} />
    </DialogContent>
   </Dialog>

   <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
    <DialogContent className="max-w-md">
     <DialogHeader><DialogTitle>Novo Template</DialogTitle></DialogHeader>
     <NewTemplateForm onClose={() => setTemplateDialogOpen(false)} />
    </DialogContent>
   </Dialog>
  </div>
 );
}
