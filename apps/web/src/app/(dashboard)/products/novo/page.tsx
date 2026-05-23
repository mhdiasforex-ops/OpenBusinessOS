'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// ── Currency formatter ────────────────────────────────────────────

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

// ── Unit options ──────────────────────────────────────────────────

const UNIT_OPTIONS = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'h', label: 'Hora (h)' },
  { value: 'kg', label: 'Quilo (kg)' },
  { value: 'l', label: 'Litro (l)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'mês', label: 'Mês (mês)' },
];

// ── Category options ──────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: 'VENDAS', label: 'Vendas' },
  { value: 'SERVICOS', label: 'Serviços' },
  { value: 'ASSINATURAS', label: 'Assinaturas' },
  { value: 'MATERIAIS', label: 'Materiais' },
  { value: 'ELETRONICOS', label: 'Eletrônicos' },
  { value: 'ALIMENTOS', label: 'Alimentos' },
  { value: 'OUTROS', label: 'Outros' },
];

// ── Page component ────────────────────────────────────────────────

export default function NovoProdutoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'OUTROS',
    costPrice: '',
    salePrice: '',
    unit: 'un',
    stockQuantity: '',
    minStock: '5',
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/products', data),
    onSuccess: () => router.push('/products'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: form.name,
      sku: form.sku,
      category: form.category,
      costPrice: Number(form.costPrice) || 0,
      salePrice: Number(form.salePrice) || 0,
      unit: form.unit,
      stockQuantity: Number(form.stockQuantity) || 0,
      minStock: Number(form.minStock) || 0,
    });
  };

  const costPrice = Number(form.costPrice) || 0;
  const salePrice = Number(form.salePrice) || 0;
  const margin =
    salePrice > 0 ? ((salePrice - costPrice) / salePrice) * 100 : 0;
  const unitProfit = salePrice - costPrice;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Novo Produto</h1>
        <Button variant="outline" onClick={() => router.push('/products')}>
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Dados do Produto ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome do produto"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="SKU-001"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  id="category"
                  options={CATEGORY_OPTIONS}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Select
                  id="unit"
                  options={UNIT_OPTIONS}
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Preços ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Preços</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.costPrice}
                  onChange={(e) =>
                    setForm({ ...form, costPrice: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.salePrice}
                  onChange={(e) =>
                    setForm({ ...form, salePrice: e.target.value })
                  }
                />
              </div>
            </div>

            {salePrice > 0 && costPrice > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Margem: </span>
                  <span className="font-bold">{margin.toFixed(1)}%</span>
                  <span className="text-muted-foreground"> | Lucro unitário: </span>
                  <span
                    className={`font-bold ${
                      unitProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatBRL(unitProfit)}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Estoque ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Estoque Atual</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stockQuantity}
                  onChange={(e) =>
                    setForm({ ...form, stockQuantity: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Estoque Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  placeholder="5"
                  value={form.minStock}
                  onChange={(e) =>
                    setForm({ ...form, minStock: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Submit ───────────────────────────────────────────── */}
        {createMutation.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            Erro ao criar produto. Verifique os dados e tente novamente.
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!form.name.trim() || createMutation.isPending}
        >
          {createMutation.isPending ? 'Criando...' : 'Criar Produto'}
        </Button>
      </form>
    </div>
  );
}
