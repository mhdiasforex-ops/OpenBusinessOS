import { describe, it, expect } from 'vitest';
import { AiAgentModule } from './ai-agent.module';

describe('AiAgentModule', () => {
  it('should be defined', () => {
    expect(new AiAgentModule()).toBeDefined();
  });
});
