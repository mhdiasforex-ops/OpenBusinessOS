export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatCurrency } from '@openbusinessos/utils';

export default function ProductsPage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['product-performance'],
    queryFn: () => api.get('/analytics/product-performance', { limit: 50 }),
  });

  const items = (products || []) as any[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Button>+ Novo Produto</Button>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Nome</th>
                <th className="text-left py-2 px-3">SKU</th>
                <th className="text-right py-2 px-3">Custo</th>
                <th className="text-right py-2 px-3">Venda</th>
                <th className="text-right py-2 px-3">Margem</th>
                <th className="text-right py-2 px-3">Estoque</th>
                <th className="text-left py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">{p.name}</td>
                  <td className="py-2 px-3 font-mono text-xs">{p.sku}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(Number(p.costPrice))}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(Number(p.salePrice))}</td>
                  <td className="py-2 px-3 text-right">{p.margin}%</td>
                  <td className="py-2 px-3 text-right">{p.stockQuantity}</td>
                  <td className="py-2 px-3">
                    {p.isLowStock ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Estoque Baixo</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
