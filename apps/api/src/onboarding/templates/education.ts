export const educationTemplate = {
  EDUCATION: {
    name: 'Educação',
    categories: ['Mensalidades', 'Cursos', 'Material Didático', 'Despesas Fixas', 'Impostos'],
    defaultProducts: [{ name: 'Mensalidade', unit: 'mês', category: 'Mensalidades' }],
    defaultWorkflows: [
      {
        name: 'Lembrete de mensalidade',
        trigger: 'PAYMENT_OVERDUE',
        steps: [
          {
            order: 1,
            type: 'SEND_EMAIL',
            config: { subject: 'Mensalidade em atraso', to: '{{customerEmail}}' },
          },
        ],
      },
    ],
    tips: [
      'Cadastre mensalidades como transações recorrentes',
      'Configure lembretes automáticos de inadimplência',
      'Use segmentação para identificar alunos em risco de evasão',
    ],
  },
};
