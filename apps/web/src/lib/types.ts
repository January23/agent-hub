export type AgentEditorCatalog = {
  skills: { id: string; name: string; description: string }[];
  mcpConfigs: { id: string; name: string; description: string }[];
  knowledgeBases: { id: string; name: string; description: string }[];
  agents: { id: string; name: string; published: boolean }[];
};

export type AgentDTO = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  skillIds: string[];
  mcpConfigIds: string[];
  knowledgeBaseIds: string[];
  linkedAgentIds: string[];
  model: { provider: string; model: string; temperature?: number };
  published: boolean;
  publishedAt: string | null;
  ownerSubject: string | null;
  createdAt: string;
  updatedAt: string;
};
