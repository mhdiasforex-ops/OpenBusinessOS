import { describe, it, expect } from 'vitest';
import { CreateWorkflowStepDto, CreateWorkflowDto, UpdateWorkflowDto } from './workflow.dto';

describe('Workflow DTOs', () => {
  it('CreateWorkflowStepDto should be defined', () => {
    expect(new CreateWorkflowStepDto()).toBeDefined();
  });
  it('CreateWorkflowDto should be defined', () => {
    expect(new CreateWorkflowDto()).toBeDefined();
  });
  it('UpdateWorkflowDto should be defined', () => {
    expect(new UpdateWorkflowDto()).toBeDefined();
  });
});
