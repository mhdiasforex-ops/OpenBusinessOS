'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// --- Tipos ---

interface Organization {
  id: string;
  name: string;
  slug: string;
  niche: string;
  plan: string;
  createdAt: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  roles: { role: Role }[];
  joinedAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

// --- Helpers ---

function formatDatePt(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function statusVariant(status: string): 'success' | 'warning' | 'secondary' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PENDING':
      return 'warning';
    default:
      return 'secondary';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Ativo';
    case 'PENDING':
      return 'Pendente';
    case 'INACTIVE':
      return 'Inativo';
    default:
      return status;
  }
}

// --- Componentes de Tab ---

function PerfilTab() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const updateProfile = useMutation({
    mutationFn: (data: { name: string; email: string }) =>
      api.patch('/user/profile', data),
    onSuccess: () => {
      if (user) {
        setUser({ ...user, name, email });
      }
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({ title: 'Perfil atualizado', description: 'Suas informações foram salvas com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar', description: 'Não foi possível salvar suas informações.', variant: 'destructive' });
    },
  });

  function handleSave() {
    updateProfile.mutate({ name, email });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Gerencie suas informações pessoais.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">{getInitials(name || 'U')}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.role}</p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">E-mail</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OrganizacaoTab() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: org, isLoading } = useQuery<Organization>({
    queryKey: ['organization'],
    queryFn: () => api.get('/organization'),
  });

  const [orgName, setOrgName] = useState('');
  const [orgNiche, setOrgNiche] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Sync form state when org data loads
  if (org && !initialized) {
    setOrgName(org.name);
    setOrgNiche(org.niche);
    setInitialized(true);
  }

  const updateOrg = useMutation({
    mutationFn: (data: { name: string; niche: string }) =>
      api.patch('/organization', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast({ title: 'Organização atualizada', description: 'As informações da organização foram salvas.' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar', description: 'Não foi possível salvar as informações da organização.', variant: 'destructive' });
    },
  });

  function handleSave() {
    updateOrg.mutate({ name: orgName, niche: orgNiche });
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Carregando informações da organização...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organização</CardTitle>
        <CardDescription>Gerencie as informações da sua organização.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="org-name">Nome da organização</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Nome da organização"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-niche">Nicho</Label>
            <Input
              id="org-niche"
              value={orgNiche}
              onChange={(e) => setOrgNiche(e.target.value)}
              placeholder="Ex: Tecnologia, Varejo, Saúde..."
            />
          </div>
        </div>

        {org && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={org.slug} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Plano</Label>
              <Input value={org.plan || 'FREE'} disabled className="bg-muted" />
            </div>
          </div>
        )}

        {org && (
          <p className="text-sm text-muted-foreground">
            Criada em {formatDatePt(org.createdAt)}
          </p>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={updateOrg.isPending}>
            {updateOrg.isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MembrosTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRoleName, setNewRoleName] = useState('member');

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ['organization', 'members'],
    queryFn: () => api.get('/organization/members'),
  });

  const addMember = useMutation({
    mutationFn: (data: { name: string; email: string; roleName: string }) =>
      api.post('/organization/members', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', 'members'] });
      setDialogOpen(false);
      setNewName('');
      setNewEmail('');
      setNewRoleName('member');
      toast({ title: 'Membro adicionado', description: 'O convite foi enviado com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro ao adicionar', description: 'Não foi possível adicionar o membro.', variant: 'destructive' });
    },
  });

  function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    addMember.mutate({ name: newName, email: newEmail, roleName: newRoleName });
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Carregando membros...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Membros</CardTitle>
          <CardDescription>Gerencie os membros da sua organização.</CardDescription>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Adicionar membro</Button>
      </CardHeader>
      <CardContent>
        {members && members.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Membro desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {member.roles?.map((r, i) => (
                        <Badge key={i} variant="info">
                          {r.role.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(member.status)}>
                      {statusLabel(member.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDatePt(member.joinedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Nenhum membro encontrado.
          </p>
        )}
      </CardContent>

      {/* Dialog para adicionar membro */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar membro</DialogTitle>
            <DialogDescription>
              Envie um convite para um novo membro na organização.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Nome</Label>
              <Input
                id="member-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do membro"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">E-mail</Label>
              <Input
                id="member-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-role">Função</Label>
              <Select
                id="member-role"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                options={[
                  { value: 'admin', label: 'Administrador' },
                  { value: 'manager', label: 'Gerente' },
                  { value: 'member', label: 'Membro' },
                  { value: 'viewer', label: 'Visualizador' },
                ]}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addMember.isPending}>
                {addMember.isPending ? 'Enviando...' : 'Enviar convite'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function FuncoesTab() {
  const { toast } = useToast();

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ['organization', 'roles'],
    queryFn: () => api.get('/organization/roles'),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Carregando funções...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {roles && roles.length > 0 ? (
        roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{role.name}</CardTitle>
                  {role.description && (
                    <CardDescription>{role.description}</CardDescription>
                  )}
                </div>
                <Badge variant="info">{role.permissions?.length || 0} permissões</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {role.permissions && role.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((perm) => (
                    <Badge key={perm.id} variant="outline" className="text-xs">
                      {perm.resource}:{perm.action}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma permissão atribuída a esta função.
                </p>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma função encontrada.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Página Principal ---

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seu perfil, organização, membros e funções.
        </p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="organizacao">Organização</TabsTrigger>
          <TabsTrigger value="membros">Membros</TabsTrigger>
          <TabsTrigger value="funcoes">Funções</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <PerfilTab />
        </TabsContent>

        <TabsContent value="organizacao">
          <OrganizacaoTab />
        </TabsContent>

        <TabsContent value="membros">
          <MembrosTab />
        </TabsContent>

        <TabsContent value="funcoes">
          <FuncoesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
