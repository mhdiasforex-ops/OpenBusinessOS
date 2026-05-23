'use client';

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageCircle, Wifi, WifiOff, FileCode, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

// ── Mock data ────────────────────────────────────────────────────

const mockConexoes = [
  { id: '1', nome: 'Clínica Principal', telefone: '+55 11 99999-0001', status: 'CONECTADO' },
  { id: '2', nome: 'Filial Campinas', telefone: '+55 19 99999-0002', status: 'DESCONECTADO' },
  { id: '3', nome: 'Setor Agendamento', telefone: '+55 11 99999-0003', status: 'CONECTADO' },
  { id: '4', nome: 'Setor Financeiro', telefone: '+55 11 99999-0004', status: 'DESCONECTADO' },
];

const mockTemplates = [
  { id: '1', nome: 'Confirmação de Consulta', categoria: 'UTILITY', status: 'APROVADO' },
  { id: '2', nome: 'Lembrete de Consulta', categoria: 'UTILITY', status: 'APROVADO' },
  { id: '3', nome: 'Promoção Mensal', categoria: 'MARKETING', status: 'PENDENTE' },
  { id: '4', nome: 'Boas-vindas', categoria: 'UTILITY', status: 'APROVADO' },
  { id: '5', nome: 'Pesquisa de Satisfação', categoria: 'UTILITY', status: 'REJEITADO' },
  { id: '6', nome: 'Campanha Vacinação', categoria: 'MARKETING', status: 'PENDENTE' },
];

const mockMensagens = [
  { id: '1', telefone: '+55 11 99999-1111', direcao: 'ENTRADA', status: 'ENTREGUE', conteudo: 'Olá, gostaria de agendar uma consulta.', data: '2026-05-20 14:30' },
  { id: '2', telefone: '+55 11 99999-2222', direcao: 'SAIDA', status: 'ENTREGUE', conteudo: 'Sua consulta está confirmada para 25/05 às 10h.', data: '2026-05-20 14:32' },
  { id: '3', telefone: '+55 19 99999-3333', direcao: 'ENTRADA', status: 'LIDO', conteudo: 'Obrigado pelo atendimento!', data: '2026-05-20 13:15' },
  { id: '4', telefone: '+55 11 99999-4444', direcao: 'SAIDA', status: 'ENVIADO', conteudo: 'Lembrete: sua consulta é amanhã às 14h.', data: '2026-05-20 10:00' },
  { id: '5', telefone: '+55 11 99999-5555', direcao: 'ENTRADA', status: 'FALHOU', conteudo: 'Preciso cancelar minha consulta.', data: '2026-05-19 16:45' },
  { id: '6', telefone: '+55 11 99999-6666', direcao: 'SAIDA', status: 'ENTREGUE', conteudo: 'Seu reembolso foi processado com sucesso.', data: '2026-05-19 11:20' },
];

// ── Badge helpers ────────────────────────────────────────────────

const conexaoStatusVariant: Record<string, 'default' | 'destructive'> = {
  CONECTADO: 'default',
  DESCONECTADO: 'destructive',
};

const conexaoStatusLabel: Record<string, string> = {
  CONECTADO: 'Conectado',
  DESCONECTADO: 'Desconectado',
};

const templateStatusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  APROVADO: 'default',
  PENDENTE: 'secondary',
  REJEITADO: 'destructive',
};

const templateStatusLabel: Record<string, string> = {
  APROVADO: 'Aprovado',
  PENDENTE: 'Pendente',
  REJEITADO: 'Rejeitado',
};

const msgStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ENTREGUE: 'default',
  ENVIADO: 'secondary',
  LIDO: 'outline',
  FALHOU: 'destructive',
};

const msgStatusLabel: Record<string, string> = {
  ENTREGUE: 'Entregue',
  ENVIADO: 'Enviado',
  LIDO: 'Lido',
  FALHOU: 'Falhou',
};

// ── Page component ───────────────────────────────────────────────

export default function WhatsAppPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">WhatsApp</h1>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <Tabs defaultValue="conexoes">
        <TabsList>
          <TabsTrigger value="conexoes">Conexões</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
        </TabsList>

        {/* ── Tab: Conexões ──────────────────────────────────────── */}
        <TabsContent value="conexoes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conexões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockConexoes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell>{c.telefone}</TableCell>
                      <TableCell>
                        <Badge variant={conexaoStatusVariant[c.status] || 'destructive'}>
                          {c.status === 'CONECTADO' ? (
                            <Wifi className="h-3 w-3 mr-1" />
                          ) : (
                            <WifiOff className="h-3 w-3 mr-1" />
                          )}
                          {conexaoStatusLabel[c.status] || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {c.status === 'DESCONECTADO' ? (
                          <Button size="sm" variant="outline">
                            Conectar
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                            Desconectar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Templates ─────────────────────────────────────── */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTemplates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.nome}</TableCell>
                      <TableCell>{t.categoria}</TableCell>
                      <TableCell>
                        <Badge variant={templateStatusVariant[t.status] || 'secondary'}>
                          {templateStatusLabel[t.status] || t.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Mensagens ─────────────────────────────────────── */}
        <TabsContent value="mensagens">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Mensagens Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Direção</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMensagens.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.telefone}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          {m.direcao === 'ENTRADA' ? (
                            <ArrowDownLeft className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-blue-500" />
                          )}
                          {m.direcao === 'ENTRADA' ? 'Recebida' : 'Enviada'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={msgStatusVariant[m.status] || 'outline'}>
                          {msgStatusLabel[m.status] || m.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate">{m.conteudo}</TableCell>
                      <TableCell>
                        {new Date(m.data).toLocaleString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
