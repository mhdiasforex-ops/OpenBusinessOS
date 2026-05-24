import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiAgentController } from './ai-agent.controller';

describe('AiAgentController', () => {
  let controller: AiAgentController;
  let aiAgentService: any;

  beforeEach(() => {
    aiAgentService = {
      chat: vi.fn().mockResolvedValue({ reply: 'Hello!' }),
      financeQuery: vi.fn().mockResolvedValue({ analysis: 'Revenue up' }),
      fiscalQuery: vi.fn().mockResolvedValue({ analysis: 'Taxes OK' }),
      crmQuery: vi.fn().mockResolvedValue({ analysis: 'Leads strong' }),
      rhQuery: vi.fn().mockResolvedValue({ analysis: 'Headcount good' }),
      triggerWorkflow: vi.fn().mockResolvedValue({ workflowId: 'wf-1' }),
      getAgents: vi.fn().mockResolvedValue([{ name: 'Finance Agent' }]),
      getConversations: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getConversation: vi.fn().mockResolvedValue({ id: 'conv-1', messages: [] }),
      submitFeedback: vi.fn().mockResolvedValue({ success: true }),
    };
    controller = new AiAgentController(aiAgentService);
  });

  it('should call chat with organizationId, message, context, and agent', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { message: 'Hello', context: 'general', agent: 'finance' };
    const result = await controller.chat(req, dto);
    expect(aiAgentService.chat).toHaveBeenCalledWith('org-123', 'Hello', 'general', 'finance');
    expect(result).toEqual({ reply: 'Hello!' });
  });

  it('should call financeQuery with organizationId, query, and parameters', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { query: 'Revenue?', parameters: { year: 2024 } };
    const result = await controller.financeQuery(req, dto);
    expect(aiAgentService.financeQuery).toHaveBeenCalledWith('org-123', 'Revenue?', { year: 2024 });
    expect(result).toEqual({ analysis: 'Revenue up' });
  });

  it('should call fiscalQuery with organizationId, query, and parameters', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { query: 'Taxes?', parameters: { year: 2024 } };
    const result = await controller.fiscalQuery(req, dto);
    expect(aiAgentService.fiscalQuery).toHaveBeenCalledWith('org-123', 'Taxes?', { year: 2024 });
    expect(result).toEqual({ analysis: 'Taxes OK' });
  });

  it('should call crmQuery with organizationId, query, and parameters', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { query: 'Leads?', parameters: { status: 'new' } };
    const result = await controller.crmQuery(req, dto);
    expect(aiAgentService.crmQuery).toHaveBeenCalledWith('org-123', 'Leads?', { status: 'new' });
    expect(result).toEqual({ analysis: 'Leads strong' });
  });

  it('should call rhQuery with organizationId, query, and parameters', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { query: 'Headcount?', parameters: { department: 'engineering' } };
    const result = await controller.rhQuery(req, dto);
    expect(aiAgentService.rhQuery).toHaveBeenCalledWith('org-123', 'Headcount?', { department: 'engineering' });
    expect(result).toEqual({ analysis: 'Headcount good' });
  });

  it('should call triggerWorkflow with organizationId, type, and data', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { type: 'invoice_reminder', data: { invoiceId: 'inv-1' } };
    const result = await controller.triggerWorkflow(req, dto);
    expect(aiAgentService.triggerWorkflow).toHaveBeenCalledWith('org-123', 'invoice_reminder', { invoiceId: 'inv-1' });
    expect(result).toEqual({ workflowId: 'wf-1' });
  });

  it('should call getAgents', async () => {
    const result = await controller.getAgents();
    expect(aiAgentService.getAgents).toHaveBeenCalledWith();
    expect(result).toEqual([{ name: 'Finance Agent' }]);
  });

  it('should call getConversations with organizationId, page, and perPage', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getConversations(req, '2', '10');
    expect(aiAgentService.getConversations).toHaveBeenCalledWith('org-123', 2, 10);
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('should call getConversation with organizationId and id', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const result = await controller.getConversation(req, 'conv-1');
    expect(aiAgentService.getConversation).toHaveBeenCalledWith('org-123', 'conv-1');
    expect(result).toEqual({ id: 'conv-1', messages: [] });
  });

  it('should call submitFeedback with organizationId, conversationId, rating, and comment', async () => {
    const req = { user: { organizationId: 'org-123', id: 'user-1' } };
    const dto = { conversationId: 'conv-1', rating: 5, comment: 'Great!' };
    const result = await controller.submitFeedback(req, dto);
    expect(aiAgentService.submitFeedback).toHaveBeenCalledWith('org-123', 'conv-1', 5, 'Great!');
    expect(result).toEqual({ success: true });
  });
});
