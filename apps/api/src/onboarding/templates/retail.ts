export const retailTemplate = {
  RETAIL: {
    name: 'Varejo',
    categories: ['Vendas', 'Compras', 'Estoque', 'Despesas Fixas', 'Impostos'],
    defaultProducts: [{ name: 'Produto A', unit: 'un', category: 'Vendas' }],
    defaultWorkflows: [
      {
        name: 'Alerta de estoque baixo',
        trigger: 'STOCK_LOW',
        steps: [
          {
            order: 1,
            type: 'SEND_EMAIL',
            config: { subject: 'Estoque baixo: {{productName}}', to: 'owner' },
          },
        ],
      },
    ],
    tips: [
      'Cadastre seus produtos com custo e preço de venda para calcular margem automaticamente',
      'Configure o alerta de estoque mínimo para nunca ficar sem produto',
      'Use a conciliação bancária para manter o caixa atualizado',
    ],
  },
};
