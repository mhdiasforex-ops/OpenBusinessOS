/**
 * Interface base para todos os agentes especializados do sistema AI Multiagente.
 * Cada agente deve implementar esta interface para ser registrado no orquestrador.
 */
export interface IBaseAgent {
  /**
   * Processa uma consulta e retorna a resposta do agente.
   * @param query - A consulta do usuário
   * @param parameters - Parâmetros opcionais para refinar a consulta
   * @returns Resposta do agente
   */
  processQuery(query: string, parameters?: Record<string, any>): Promise<AgentResponse>;

  /**
   * Retorna o nome identificador do agente.
   */
  getName(): string;

  /**
   * Retorna as capacidades/descrição do agente.
   */
  getCapabilities(): string[];
}

export interface AgentResponse {
  agent: string;
  content: string;
  data?: Record<string, any>;
  confidence?: number;
  timestamp: Date;
}
