export const constructionTemplate = {
  CONSTRUCTION: {
    name: 'Construção',
    categories: ['Vendas', 'Materiais', 'Mão de Obra', 'Subempreitadas', 'Despesas Fixas', 'Impostos'],
    defaultProducts: [{ name: 'Material', unit: 'un', category: 'Materiais' }],
    defaultWorkflows: [
      {
        name: 'Alerta de material baixo',
        trigger: 'STOCK_LOW',
        steps: [
          {
            order: 1,
            type: 'SEND_EMAIL',
            config: { subject: 'Material em falta: {{productName}}', to: 'obra' },
          },
        ],
      },
    ],
    tips: [
      'Controle materiais e mão de obra separadamente por obra',
      'Use categorias para separar custos diretos e indiretos',
      'Concilie pagamentos de subempreiteiros regularmente',
    ],
  },
};
