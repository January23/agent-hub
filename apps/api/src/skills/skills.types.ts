export type Skill = {
  id: string;
  name: string;
  description: string;
  /** 技能说明 / 工具定义等（后续可接文件、YAML） */
  definition: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSkillDto = {
  name: string;
  description?: string;
  definition?: string;
};

export type UpdateSkillDto = Partial<CreateSkillDto>;
