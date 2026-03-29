export type Agent = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  skillIds: string[];
  mcpConfigIds: string[];
  knowledgeBaseIds: string[];
  linkedAgentIds: string[];
  modelId: string; // 关联大模型配置ID
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
  modelId: string;
};

export type UpdateAgentDto = Partial<CreateAgentDto>;
