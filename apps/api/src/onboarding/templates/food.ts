export const foodTemplate = {
  FOOD: {
    name: 'Alimentação',
    categories: ['Vendas', 'Insumos', 'Desperdício', 'Delivery', 'Despesas Fixas', 'Impostos'],
    defaultProducts: [{ name: 'Prato do Dia', unit: 'un', category: 'Vendas' }],
    defaultWorkflows: [
      {
        name: 'Alerta de insumo baixo',
        trigger: 'STOCK_LOW',
        steps: [
          {
            order: 1,
            type: 'SEND_WHATSAPP',
            config: { message: 'Insumo baixo: {{productName}}', to: 'manager' },
          },
        ],
      },
    ],
    tips: [
      'Controle insumos e desperdício separadamente para calcular CMV',
      'Configure alertas de estoque mínimo para ingredientes críticos',
      'Use o DRE mensal para monitorar a margem do restaurante',
    ],
  },
};
