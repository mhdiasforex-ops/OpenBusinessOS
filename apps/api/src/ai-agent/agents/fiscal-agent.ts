import { Injectable } from '@nestjs/common';
import { IBaseAgent, AgentResponse } from './base-agent.interface';

@Injectable()
export class FiscalAgent implements IBaseAgent {
  async processQuery(query: string, parameters?: Record<string, any>): Promise<AgentResponse> {
    // TODO: Integrar com FiscalService para dados reais
    return {
      agent: this.getName(),
      content: `Resposta do agente fiscal para: "${query}"`,
      data: {
        pendingInvoices: 12,
        taxObligations: [
          { name: 'ICMS', dueDate: '2026-06-15', value: 15000 },
          { name: 'PIS/COFINS', dueDate: '2026-06-25', value: 8500 },
          { name: 'IRPJ', dueDate: '2026-07-31', value: 22000 },
        ],
        nfEmitidas: { mes: 245, pendentes: 3 },
      },
      confidence: 0.80,
      timestamp: new Date(),
    };
  }

  getName(): string {
    return 'fiscal';
  }

  getCapabilities(): string[] {
    return [
      'Consultar obrigações tributárias',
      'Emitir e consultar notas fiscais',
      'Verificar compliance fiscal',
      'Calcular tributos (ICMS, PIS/COFINS, IRPJ, CSLL)',
      'Acompanhar prazos fiscais',
      'Gerar relatórios de retenções',
    ];
  }
}
