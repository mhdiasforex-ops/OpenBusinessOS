'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NovoProdutoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'un',
    costPrice: 0,
    salePrice: 0,
    minStock: 5,
    stockQuantity: 0,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/products', form),
    onSuccess: () => router.push('/products'),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Novo Produto</h1>
        <Button variant="outline" onClick={() => router.push('/products')}>Cancelar</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Dados do Produto</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do produto" />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Vendas" />
            </div>
            <div>
              <Label>Unidade</Label>
              <select className="w-full border rounded px-3 py-2 text-sm bg-card" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="un">Unidade (un)</option>
                <option value="h">Hora (h)</option>
                <option value="kg">Quilo (kg)</option>
                <option value="l">Litro (l)</option>
                <option value="m">Metro (m)</option>
                <option value="mês">Mês (mês)</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Preço de Custo (R$)</Label>
              <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Preço de Venda (R$)</Label>
              <Input type="number" step="0.01" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Estoque Atual</Label>
              <Input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Estoque Mínimo</Label>
              <Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
            </div>
          </div>
          {form.salePrice > 0 && form.costPrice > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="text-muted-foreground">Margem: </span>
                <span className="font-bold">
                  {((form.salePrice - form.costPrice) / form.salePrice * 100).toFixed(1)}%
                </span>
                <span className="text-muted-foreground"> | Lucro unitário: </span>
                <span className="font-bold text-green-600">
                  R$ {(form.salePrice - form.costPrice).toFixed(2)}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" disabled={!form.name} onClick={() => createMutation.mutate()}>
        Criar Produto
      </Button>
    </div>
  );
}
