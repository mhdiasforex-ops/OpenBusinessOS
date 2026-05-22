'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useState } from 'react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const { data: org } = useQuery({
    queryKey: ['organization'],
    queryFn: () => api.get(`/organizations/${user?.organizationId}`).then((r) => r.data),
    enabled: !!user?.organizationId,
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get(`/organizations/${user?.organizationId}/members`).then((r) => r.data),
    enabled: !!user?.organizationId,
  });

  const { data: stats } = useQuery({
    queryKey: ['org-stats'],
    queryFn: () => api.get(`/organizations/${user?.organizationId}/stats`).then((r) => r.data),
    enabled: !!user?.organizationId,
  });

  const enableMfa = useMutation({
    mutationFn: () => api.post('/auth/mfa/enable').then((r) => r.data),
    onSuccess: () => setMfaEnabled(true),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>

      {/* Organization */}
      <Card>
        <CardHeader><CardTitle>Empresa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nome</Label>
              <Input value={org?.name || ''} disabled />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={org?.slug || ''} disabled />
            </div>
            <div>
              <Label>Nicho</Label>
              <Input value={org?.niche || ''} disabled />
            </div>
            <div>
              <Label>Plano</Label>
              <Input value={org?.plan || 'FREE'} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <Card>
          <CardHeader><CardTitle>Estatísticas</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="text-center"><p className="text-2xl font-bold">{stats.users}</p><p className="text-xs text-muted-foreground">Usuários</p></div>
              <div className="text-center"><p className="text-2xl font-bold">{stats.products}</p><p className="text-xs text-muted-foreground">Produtos</p></div>
              <div className="text-center"><p className="text-2xl font-bold">{stats.customers}</p><p className="text-xs text-muted-foreground">Clientes</p></div>
              <div className="text-center"><p className="text-2xl font-bold">{stats.transactions}</p><p className="text-xs text-muted-foreground">Transações</p></div>
              <div className="text-center"><p className="text-2xl font-bold">{stats.workflows}</p><p className="text-xs text-muted-foreground">Automações</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader><CardTitle>Membros ({members?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members?.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {m.roles?.map((r: any) => (
                    <span key={r.role.id} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">{r.role.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader><CardTitle>Segurança</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Autenticação de dois fatores (MFA)</p>
              <p className="text-sm text-muted-foreground">Proteja sua conta com TOTP</p>
            </div>
            <Button variant={mfaEnabled ? 'destructive' : 'default'} onClick={() => enableMfa.mutate()}>
              {mfaEnabled ? 'Desabilitar MFA' : 'Habilitar MFA'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
