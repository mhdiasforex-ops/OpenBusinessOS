export const healthTemplate = {
  HEALTH: {
    name: 'Saúde',
    categories: ['Consultas', 'Procedimentos', 'Convênios', 'Despesas Fixas', 'Impostos'],
    defaultProducts: [{ name: 'Consulta', unit: 'un', category: 'Consultas' }],
    defaultWorkflows: [
      {
        name: 'Lembrete de consulta',
        trigger: 'TRANSACTION_CREATED',
        steps: [
          { order: 1, type: 'DELAY', config: { seconds: 3600 } },
          {
            order: 2,
            type: 'SEND_WHATSAPP',
            config: {
              message: 'Lembrete: sua consulta é em {{dueDate}}',
              to: '{{customerPhone}}',
            },
          },
        ],
      },
    ],
    tips: [
      'Cadastre convênios como clientes corporativos',
      'Automatize lembretes de consulta para reduzir no-shows',
      'Acompanhe a inadimplência por convênio',
    ],
  },
};
