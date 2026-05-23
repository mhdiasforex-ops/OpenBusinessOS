import { Injectable } from '@nestjs/common';
import { IBaseAgent, AgentResponse } from './base-agent.interface';

@Injectable()
export class RhAgent implements IBaseAgent {
  async processQuery(query: string, parameters?: Record<string, any>): Promise<AgentResponse> {
    // TODO: Integrar com módulo RH para dados reais
    return {
      agent: this.getName(),
      content: `Resposta do agente RH para: "${query}"`,
      data: {
        totalEmployees: 85,
        onVacation: 5,
        pendingVacation: 12,
        payroll: { total: 285000, benefits: 45000 },
        upcomingHolidays: [
          { date: '2026-06-04', name: 'Corpus Christi' },
          { date: '2026-06-24', name: 'Dia de São João' },
        ],
        pendingTimeOff: 3,
      },
      confidence: 0.82,
      timestamp: new Date(),
    };
  }

  getName(): string {
    return 'rh';
  }

  getCapabilities(): string[] {
    return [
      'Consultar folha de pagamento',
      'Gerenciar férias e ausências',
      'Consultar dados de colaboradores',
      'Calcular encargos trabalhistas',
      'Acompanhar banco de horas',
      'Gerar relatórios de headcount',
    ];
  }
}
