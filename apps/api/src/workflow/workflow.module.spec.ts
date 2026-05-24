import { describe, it, expect } from 'vitest';
import { WorkflowModule } from './workflow.module';

describe('WorkflowModule', () => {
  it('should be defined', () => {
    expect(new WorkflowModule()).toBeDefined();
  });
});
