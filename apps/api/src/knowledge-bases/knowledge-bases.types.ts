export type KnowledgeBase = {
  id: string;
  name: string;
  description: string;
  /** 占位：对象存储路径、集合名、Embedding 配置等 */
  storageHint: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateKnowledgeBaseDto = {
  name: string;
  description?: string;
  storageHint?: string;
};

export type UpdateKnowledgeBaseDto = Partial<CreateKnowledgeBaseDto>;
