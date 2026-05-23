import { Injectable } from '@nestjs/common';
import { IBaseAgent, AgentResponse } from './base-agent.interface';

@Injectable()
export class FinanceAgent implements IBaseAgent {
  async processQuery(query: string, parameters?: Record<string, any>): Promise<AgentResponse> {
    // TODO: Integrar com FinancialService para dados reais
    return {
      agent: this.getName(),
      content: `Resposta do agente financeiro para: "${query}"`,
      data: {
        revenue: { current: 125000, previous: 110000, variation: 13.6 },
        expenses: { current: 85000, previous: 90000, variation: -5.5 },
        profit: { current: 40000, previous: 20000, variation: 100 },
      },
      confidence: 0.85,
      timestamp: new Date(),
    };
  }

  getName(): string {
    return 'finance';
  }

  getCapabilities(): string[] {
    return [
      'Consultar receitas e despesas',
      'Gerar relatórios financeiros (DRE, fluxo de caixa)',
      'Analisar indicadores financeiros',
      'Projetar cenários financeiros',
      'Conciliação bancária',
      'Análise de inadimplência',
    ];
  }
}
