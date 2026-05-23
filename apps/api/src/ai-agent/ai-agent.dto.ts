import { IsString, IsOptional, IsObject, IsNumber, Min, Max } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  agent?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AgentQueryDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @IsOptional()
  @IsString()
  timeframe?: string;
}

export class WorkflowTriggerDto {
  @IsString()
  type!: string;

  @IsObject()
  data!: Record<string, any>;

  @IsOptional()
  @IsString()
  schedule?: string;
}

export class FeedbackDto {
  @IsString()
  conversationId!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
