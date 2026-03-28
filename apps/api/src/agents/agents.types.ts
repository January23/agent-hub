export type AgentModelConfig = {
  provider: string;
  model: string;
  temperature?: number;
};

export type Agent = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  skillIds: string[];
  mcpConfigIds: string[];
  knowledgeBaseIds: string[];
  linkedAgentIds: string[];
  model: AgentModelConfig;
  published: boolean;
  publishedAt: string | null;
  /** 预留：内网登录主体，来自 x-agent-hub-user 等 */
  ownerSubject: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAgentDto = {
  name: string;
  description?: string;
  prompt?: string;
  skillIds?: string[];
  mcpConfigIds?: string[];
  knowledgeBaseIds?: string[];
  linkedAgentIds?: string[];
  model?: Partial<AgentModelConfig>;
};

export type UpdateAgentDto = Partial<CreateAgentDto>;
