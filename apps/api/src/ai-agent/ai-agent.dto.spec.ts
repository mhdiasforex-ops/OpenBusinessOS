import { describe, it, expect } from 'vitest';
import { ChatRequestDto, AgentQueryDto, WorkflowTriggerDto, FeedbackDto } from './ai-agent.dto';

describe('AiAgent DTOs', () => {
  it('ChatRequestDto should be defined', () => {
    expect(new ChatRequestDto()).toBeDefined();
  });
  it('AgentQueryDto should be defined', () => {
    expect(new AgentQueryDto()).toBeDefined();
  });
  it('WorkflowTriggerDto should be defined', () => {
    expect(new WorkflowTriggerDto()).toBeDefined();
  });
  it('FeedbackDto should be defined', () => {
    expect(new FeedbackDto()).toBeDefined();
  });
});
