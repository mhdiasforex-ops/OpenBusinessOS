export const servicesTemplate = {
  SERVICES: {
    name: 'Serviços',
    categories: ['Honorários', 'Projetos', 'Assinaturas', 'Despesas Operacionais', 'Impostos'],
    defaultProducts: [{ name: 'Consultoria', unit: 'h', category: 'Honorários' }],
    defaultWorkflows: [
      {
        name: 'Lembrete de pagamento',
        trigger: 'PAYMENT_OVERDUE',
        steps: [
          {
            order: 1,
            type: 'SEND_WHATSAPP',
            config: {
              message: 'Olá, seu pagamento venceu. Pode regularizar?',
              to: '{{customerPhone}}',
            },
          },
        ],
      },
    ],
    tips: [
      'Cadastre serviços como produtos com unit = "h" para controle por hora',
      'Configure lembretes automáticos de pagamento',
      'Use segmentação para identificar clientes com risco de churn',
    ],
  },
};
