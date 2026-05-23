import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';

export interface AgentResponse {
  agent: string;
  response: string;
  confidence: number;
  data?: Record<string, any>;
  suggestions?: string[];
}

@Injectable()
export class AiAgentService {
  private readonly agents = [
    { id: 'orchestrator', name: 'Orquestrador', capabilities: ['roteamento', 'contexto', 'multi-agente'] },
    { id: 'finance', name: 'Agente Financeiro', capabilities: ['dre', 'fluxo-caixa', 'contas-pagar', 'contas-receber', 'relatorios'] },
    { id: 'fiscal', name: 'Agente Fiscal', capabilities: ['nfe', 'nfce', 'nfse', 'sped', 'tributos', 'icms', 'pis-cofins'] },
    { id: 'crm', name: 'Agente CRM', capabilities: ['clientes', 'funil-vendas', 'leads', 'oportunidades', 'marketing'] },
    { id: 'rh', name: 'Agente RH', capabilities: ['folha-pagamento', 'ferias', 'ponto', 'admissao', 'demissao'] },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  private async emitEvent(orgId: string, type: string, payload: Record<string, any>) {
    await this.eventBus.emit({ organizationId: orgId, type, source: 'ai-agent', payload });
  }

  async chat(orgId: string, message: string, context?: string, agent?: string): Promise<AgentResponse> {
    const targetAgent = agent || this.routeToAgent(message);
    await this.emitEvent(orgId, 'ai-agent.chat', { message, agent: targetAgent });
    return {
      agent: targetAgent,
      response: `Resposta simulada do agente ${targetAgent} para: "${message}"`,
      confidence: 0.85,
      data: { orgId, context },
      suggestions: ['Ver relatório detalhado', 'Exportar dados', 'Consultar agente especializado'],
    };
  }

  async financeQuery(orgId: string, query: string, parameters?: Record<string, any>): Promise<AgentResponse> {
    await this.emitEvent(orgId, 'ai-agent.finance-query', { query, parameters });
    return {
      agent: 'finance',
      response: `Análise financeira para: "${query}"`,
      confidence: 0.9,
      data: { receita: 150000, despesa: 95000, lucro: 55000, margem: 36.7 },
      suggestions: ['Ver DRE completo', 'Analisar fluxo de caixa', 'Comparar com período anterior'],
    };
  }

  async fiscalQuery(orgId: string, query: string, parameters?: Record<string, any>): Promise<AgentResponse> {
    await this.emitEvent(orgId, 'ai-agent.fiscal-query', { query, parameters });
    return {
      agent: 'fiscal',
      response: `Consulta fiscal para: "${query}"`,
      confidence: 0.88,
      data: { notasEmitidas: 145, impostosDevidos: 28500, creditos: 12300 },
      suggestions: ['Ver SPED Fiscal', 'Consultar ICMS devido', 'Relatório de PIS/COFINS'],
    };
  }

  async crmQuery(orgId: string, query: string, parameters?: Record<string, any>): Promise<AgentResponse> {
    await this.emitEvent(orgId, 'ai-agent.crm-query', { query, parameters });
    return {
      agent: 'crm',
      response: `Análise CRM para: "${query}"`,
      confidence: 0.87,
      data: { leadsAtivos: 42, oportunidades: 18, conversao: 28.5, ticketMedio: 3500 },
      suggestions: ['Ver funil de vendas', 'Analisar taxa de conversão', 'Segmentar clientes'],
    };
  }

  async rhQuery(orgId: string, query: string, parameters?: Record<string, any>): Promise<AgentResponse> {
    await this.emitEvent(orgId, 'ai-agent.rh-query', { query, parameters });
    return {
      agent: 'rh',
      response: `Consulta RH para: "${query}"`,
      confidence: 0.86,
      data: { colaboradores: 25, folhaMensal: 185000, feriasPendentes: 8 },
      suggestions: ['Ver folha de pagamento', 'Controle de férias', 'Relatório de ponto'],
    };
  }

  async triggerWorkflow(orgId: string, type: string, data: Record<string, any>) {
    await this.emitEvent(orgId, 'ai-agent.workflow-trigger', { type, data });
    return { workflowId: `wf-${Date.now()}`, status: 'started', message: `Workflow "${type}" iniciado com sucesso` };
  }

  async getAgents() { return this.agents; }

  async getConversations(orgId: string, page = 1, perPage = 20) {
    return { data: [], total: 0, page, perPage, totalPages: 0 };
  }

  async getConversation(orgId: string, id: string) {
    return { id, organizationId: orgId, agent: 'orchestrator', messages: [], createdAt: new Date().toISOString() };
  }

  async submitFeedback(orgId: string, conversationId: string, rating: number, comment?: string) {
    await this.emitEvent(orgId, 'ai-agent.feedback', { conversationId, rating, comment });
    return { conversationId, rating, comment, status: 'recorded' };
  }

  private routeToAgent(message: string): string {
    const lower = message.toLowerCase();
    if (/financeiro|receita|despesa|pagar|receber|balan[cç]o|dre/i.test(lower)) return 'finance';
    if (/fiscal|nfe|nfce|nfse|icms|sped|tributo|imposto/i.test(lower)) return 'fiscal';
    if (/cliente|lead|funil|venda|oportunidade|crm/i.test(lower)) return 'crm';
    if (/funcion[aá]rio|folha|f[eé]rias|ponto|rh|admiss[aã]o/i.test(lower)) return 'rh';
    return 'orchestrator';
  }
}
