import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiAgentService } from './ai-agent.service';

describe('AiAgentService', () => {
  let service: AiAgentService;
  let prisma: any;
  let eventBus: any;

  const orgId = 'org-123';

  beforeEach(() => {
    prisma = {};
    eventBus = { emit: vi.fn().mockResolvedValue(undefined) };
    service = new AiAgentService(prisma, eventBus);
  });

  // ──────────────────────────────────────────────
  // CHAT
  // ──────────────────────────────────────────────

  describe('chat', () => {
    it('should route finance-related message to finance agent', async () => {
      const result = await service.chat(orgId, 'Qual a receita do mês?');

      expect(result.agent).toBe('finance');
      expect(result.response).toContain('Resposta simulada do agente finance');
      expect(result.confidence).toBe(0.85);
      expect(result.suggestions).toHaveLength(3);
      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'ai-agent.chat',
        source: 'ai-agent',
        payload: { message: 'Qual a receita do mês?', agent: 'finance' },
      });
    });

    it('should route fiscal-related message to fiscal agent', async () => {
      const result = await service.chat(orgId, 'Quero emitir uma NFe');

      expect(result.agent).toBe('fiscal');
    });

    it('should route CRM-related message to crm agent', async () => {
      const result = await service.chat(orgId, 'Como está o funil de vendas?');

      expect(result.agent).toBe('crm');
    });

    it('should route RH-related message to rh agent', async () => {
      const result = await service.chat(orgId, 'Preciso da folha de pagamento');

      expect(result.agent).toBe('rh');
    });

    it('should route unrecognized message to orchestrator', async () => {
      const result = await service.chat(orgId, 'Bom dia, o que você pode fazer?');

      expect(result.agent).toBe('orchestrator');
    });

    it('should use explicit agent parameter when provided', async () => {
      const result = await service.chat(orgId, 'alguma mensagem', undefined, 'finance');

      expect(result.agent).toBe('finance');
    });

    it('should pass context data in response', async () => {
      const context = 'session-abc';
      const result = await service.chat(orgId, 'Olá', context);

      expect(result.data).toEqual({ orgId, context });
    });

    it('should route using financeiro keyword', async () => {
      const result = await service.chat(orgId, 'relatório financeiro');

      expect(result.agent).toBe('finance');
    });

    it('should route using receita keyword', async () => {
      const result = await service.chat(orgId, 'receita do mês');

      expect(result.agent).toBe('finance');
    });

    it('should route using despesa keyword', async () => {
      const result = await service.chat(orgId, 'despesas acumuladas');

      expect(result.agent).toBe('finance');
    });

    it('should route using pagar keyword', async () => {
      const result = await service.chat(orgId, 'contas a pagar');

      expect(result.agent).toBe('finance');
    });

    it('should route using receber keyword', async () => {
      const result = await service.chat(orgId, 'contas a receber');

      expect(result.agent).toBe('finance');
    });

    it('should route using balanço keyword', async () => {
      const result = await service.chat(orgId, 'balanço patrimonial');

      expect(result.agent).toBe('finance');
    });

    it('should route using balanço (with cedilha) keyword', async () => {
      const result = await service.chat(orgId, 'balanço financeiro');

      expect(result.agent).toBe('finance');
    });

    it('should route using dre keyword', async () => {
      const result = await service.chat(orgId, 'DRE do período');

      expect(result.agent).toBe('finance');
    });

    it('should route using nfe keyword to fiscal', async () => {
      const result = await service.chat(orgId, 'nota fiscal nfe');

      expect(result.agent).toBe('fiscal');
    });

    it('should route using nfce keyword to fiscal', async () => {
      const result = await service.chat(orgId, 'nfce emitida');

      expect(result.agent).toBe('fiscal');
    });

    it('should route using nfse keyword to fiscal', async () => {
      const result = await service.chat(orgId, 'nfse serviço');

      expect(result.agent).toBe('fiscal');
    });

    it('should route using icms keyword to fiscal', async () => {
      const result = await service.chat(orgId, 'icms devido');

      expect(result.agent).toBe('fiscal');
    });

    it('should route using sped keyword to fiscal', async () => {
      const result = await service.chat(orgId, 'SPED fiscal');

      expect(result.agent).toBe('fiscal');
    });

    it('should route using tributo keyword to fiscal', async () => {
      const result = await service.chat(orgId, 'tributos federais');

      expect(result.agent).toBe('fiscal');
    });

    it('should route using imposto keyword to fiscal', async () => {
      const result = await service.chat(orgId, 'imposto de renda');

      expect(result.agent).toBe('fiscal');
    });

    it('should route using cliente keyword to crm', async () => {
      const result = await service.chat(orgId, 'cadastro de cliente');

      expect(result.agent).toBe('crm');
    });

    it('should route using lead keyword to crm', async () => {
      const result = await service.chat(orgId, 'novo lead');

      expect(result.agent).toBe('crm');
    });

    it('should route using funil keyword to crm', async () => {
      const result = await service.chat(orgId, 'funil de vendas');

      expect(result.agent).toBe('crm');
    });

    it('should route using venda keyword to crm', async () => {
      const result = await service.chat(orgId, 'vendas do mês');

      expect(result.agent).toBe('crm');
    });

    it('should route using oportunidade keyword to crm', async () => {
      const result = await service.chat(orgId, 'oportunidades abertas');

      expect(result.agent).toBe('crm');
    });

    it('should route using crm keyword to crm', async () => {
      const result = await service.chat(orgId, 'CRM integração');

      expect(result.agent).toBe('crm');
    });

    it('should route using funcionário keyword to rh', async () => {
      const result = await service.chat(orgId, 'funcionário novo');

      expect(result.agent).toBe('rh');
    });

    it('should route using funcionário (with acute) keyword to rh', async () => {
      const result = await service.chat(orgId, 'funcionário admitido');

      expect(result.agent).toBe('rh');
    });

    it('should route using folha keyword to rh', async () => {
      const result = await service.chat(orgId, 'folha de pagamento');

      expect(result.agent).toBe('rh');
    });

    it('should route using férias keyword to rh', async () => {
      const result = await service.chat(orgId, 'férias pendentes');

      expect(result.agent).toBe('rh');
    });

    it('should route using ferias (no accent) keyword to rh', async () => {
      const result = await service.chat(orgId, 'ferias atrasadas');

      expect(result.agent).toBe('rh');
    });

    it('should route using ponto keyword to rh', async () => {
      const result = await service.chat(orgId, 'ponto eletrônico');

      expect(result.agent).toBe('rh');
    });

    it('should route using rh keyword to rh', async () => {
      const result = await service.chat(orgId, 'departamento de rh');

      expect(result.agent).toBe('rh');
    });

    it('should route using admissão keyword to rh', async () => {
      const result = await service.chat(orgId, 'admissão de funcionário');

      expect(result.agent).toBe('rh');
    });

    it('should route using admissão (with acute) keyword to rh', async () => {
      const result = await service.chat(orgId, 'admissão nova');

      expect(result.agent).toBe('rh');
    });
  });

  // ──────────────────────────────────────────────
  // FINANCE QUERY
  // ──────────────────────────────────────────────

  describe('financeQuery', () => {
    it('should return structured financial data', async () => {
      const result = await service.financeQuery(orgId, 'análise mensal');

      expect(result.agent).toBe('finance');
      expect(result.confidence).toBe(0.9);
      expect(result.data).toEqual({ receita: 150000, despesa: 95000, lucro: 55000, margem: 36.7 });
      expect(result.suggestions).toContain('Ver DRE completo');
      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'ai-agent.finance-query',
        source: 'ai-agent',
        payload: { query: 'análise mensal', parameters: undefined },
      });
    });

    it('should pass parameters to event', async () => {
      const params = { periodo: '2026-01', comparativo: true };
      await service.financeQuery(orgId, 'query', params);

      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ parameters: params }),
        }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // FISCAL QUERY
  // ──────────────────────────────────────────────

  describe('fiscalQuery', () => {
    it('should return structured fiscal data', async () => {
      const result = await service.fiscalQuery(orgId, 'impostos devidos');

      expect(result.agent).toBe('fiscal');
      expect(result.confidence).toBe(0.88);
      expect(result.data).toEqual({ notasEmitidas: 145, impostosDevidos: 28500, creditos: 12300 });
      expect(result.suggestions).toContain('Ver SPED Fiscal');
    });
  });

  // ──────────────────────────────────────────────
  // CRM QUERY
  // ──────────────────────────────────────────────

  describe('crmQuery', () => {
    it('should return structured CRM data', async () => {
      const result = await service.crmQuery(orgId, 'leads ativos');

      expect(result.agent).toBe('crm');
      expect(result.confidence).toBe(0.87);
      expect(result.data).toEqual({ leadsAtivos: 42, oportunidades: 18, conversao: 28.5, ticketMedio: 3500 });
      expect(result.suggestions).toContain('Ver funil de vendas');
    });

    it('should pass parameters to event', async () => {
      await service.crmQuery(orgId, 'consulta', { filtro: 'todos' });

      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ parameters: { filtro: 'todos' } }),
        }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // RH QUERY
  // ──────────────────────────────────────────────

  describe('rhQuery', () => {
    it('should return structured RH data', async () => {
      const result = await service.rhQuery(orgId, 'folha mensal');

      expect(result.agent).toBe('rh');
      expect(result.confidence).toBe(0.86);
      expect(result.data).toEqual({ colaboradores: 25, folhaMensal: 185000, feriasPendentes: 8 });
      expect(result.suggestions).toContain('Ver folha de pagamento');
    });
  });

  // ──────────────────────────────────────────────
  // TRIGGER WORKFLOW
  // ──────────────────────────────────────────────

  describe('triggerWorkflow', () => {
    it('should return a workflow ID with started status', async () => {
      const result = await service.triggerWorkflow(orgId, 'generate-report', { period: '2026-01' });

      expect(result.workflowId).toMatch(/^wf-/);
      expect(result.status).toBe('started');
      expect(result.message).toContain('generate-report');
    });

    it('should emit a workflow event', async () => {
      await service.triggerWorkflow(orgId, 'sync', {});

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'ai-agent.workflow-trigger',
        source: 'ai-agent',
        payload: { type: 'sync', data: {} },
      });
    });

    it('should generate workflow IDs with correct prefix', async () => {
      const result = await service.triggerWorkflow(orgId, 'sync', {});

      expect(result.workflowId).toMatch(/^wf-/);
      expect(result.status).toBe('started');
    });
  });

  // ──────────────────────────────────────────────
  // GET AGENTS
  // ──────────────────────────────────────────────

  describe('getAgents', () => {
    it('should return all 5 agents with capabilities', async () => {
      const agents = await service.getAgents();

      expect(agents).toHaveLength(5);
      expect(agents[0]).toEqual({ id: 'orchestrator', name: 'Orquestrador', capabilities: expect.any(Array) });
    });

    it('should include finance agent with DRE capability', async () => {
      const agents = await service.getAgents();
      const finance = agents.find((a) => a.id === 'finance');

      expect(finance).toBeDefined();
      expect(finance!.capabilities).toContain('dre');
    });

    it('should include fiscal agent with NFE capability', async () => {
      const agents = await service.getAgents();
      const fiscal = agents.find((a) => a.id === 'fiscal');

      expect(fiscal).toBeDefined();
      expect(fiscal!.capabilities).toContain('nfe');
    });

    it('should include CRM agent with clientes capability', async () => {
      const agents = await service.getAgents();
      const crm = agents.find((a) => a.id === 'crm');

      expect(crm).toBeDefined();
      expect(crm!.capabilities).toContain('clientes');
    });

    it('should include RH agent with folha-pagamento capability', async () => {
      const agents = await service.getAgents();
      const rh = agents.find((a) => a.id === 'rh');

      expect(rh).toBeDefined();
      expect(rh!.capabilities).toContain('folha-pagamento');
    });
  });

  // ──────────────────────────────────────────────
  // GET CONVERSATIONS
  // ──────────────────────────────────────────────

  describe('getConversations', () => {
    it('should return empty paginated result with defaults', async () => {
      const result = await service.getConversations(orgId);

      expect(result).toEqual({ data: [], total: 0, page: 1, perPage: 20, totalPages: 0 });
    });

    it('should reflect custom pagination parameters', async () => {
      const result = await service.getConversations(orgId, 2, 10);

      expect(result.page).toBe(2);
      expect(result.perPage).toBe(10);
    });
  });

  // ──────────────────────────────────────────────
  // GET CONVERSATION
  // ──────────────────────────────────────────────

  describe('getConversation', () => {
    it('should return a conversation object with org ID and messages', async () => {
      const result = await service.getConversation(orgId, 'conv-1');

      expect(result.id).toBe('conv-1');
      expect(result.organizationId).toBe(orgId);
      expect(result.agent).toBe('orchestrator');
      expect(result.messages).toEqual([]);
      expect(result.createdAt).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────
  // SUBMIT FEEDBACK
  // ──────────────────────────────────────────────

  describe('submitFeedback', () => {
    it('should record feedback with rating and comment', async () => {
      const result = await service.submitFeedback(orgId, 'conv-1', 5, 'Ótimo atendimento');

      expect(result.conversationId).toBe('conv-1');
      expect(result.rating).toBe(5);
      expect(result.comment).toBe('Ótimo atendimento');
      expect(result.status).toBe('recorded');
    });

    it('should emit a feedback event', async () => {
      await service.submitFeedback(orgId, 'conv-1', 3);

      expect(eventBus.emit).toHaveBeenCalledWith({
        organizationId: orgId,
        type: 'ai-agent.feedback',
        source: 'ai-agent',
        payload: { conversationId: 'conv-1', rating: 3, comment: undefined },
      });
    });

    it('should record feedback without comment', async () => {
      const result = await service.submitFeedback(orgId, 'conv-2', 4);

      expect(result.rating).toBe(4);
      expect(result.comment).toBeUndefined();
    });

    it('should record low rating', async () => {
      const result = await service.submitFeedback(orgId, 'conv-3', 1, 'Ruim');

      expect(result.rating).toBe(1);
      expect(result.status).toBe('recorded');
    });
  });
});
