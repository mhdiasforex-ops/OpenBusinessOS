import { Injectable } from '@nestjs/common';
import { IBaseAgent, AgentResponse } from './base-agent.interface';

@Injectable()
export class CrmAgent implements IBaseAgent {
  async processQuery(query: string, parameters?: Record<string, any>): Promise<AgentResponse> {
    // TODO: Integrar com CrmService para dados reais
    return {
      agent: this.getName(),
      content: `Resposta do agente CRM para: "${query}"`,
      data: {
        totalClients: 1240,
        activeClients: 980,
        churnRate: 4.2,
        funnel: {
          leads: 320,
          qualified: 180,
          proposal: 95,
          closed: 62,
        },
        ltv: 18500,
        nps: 72,
      },
      confidence: 0.88,
      timestamp: new Date(),
    };
  }

  getName(): string {
    return 'crm';
  }

  getCapabilities(): string[] {
    return [
      'Consultar dados de clientes',
      'Analisar funil de vendas',
      'Calcular LTV e métricas de retenção',
      'Detectar risco de churn',
      'Segmentar clientes',
      'Gerar relatórios de campanhas',
    ];
  }
}
