export const ecommerceTemplate = {
  ECOMMERCE: {
    name: 'E-commerce',
    categories: ['Vendas Online', 'Marketplace', 'Frete', 'Comissões', 'Devolução', 'Despesas Fixas'],
    defaultProducts: [{ name: 'Produto Digital', unit: 'un', category: 'Vendas Online' }],
    defaultWorkflows: [
      {
        name: 'Follow-up pós-venda',
        trigger: 'TRANSACTION_PAID',
        steps: [
          { order: 1, type: 'DELAY', config: { seconds: 86400 } },
          {
            order: 2,
            type: 'SEND_EMAIL',
            config: { subject: 'Como foi sua experiência?', to: '{{customerEmail}}' },
          },
        ],
      },
    ],
    tips: [
      'Acompanhe as comissões de marketplace separadamente',
      'Configure workflows automáticos para follow-up pós-venda',
      'Monitore o LTV dos clientes para campanhas de reengajamento',
    ],
  },
};
