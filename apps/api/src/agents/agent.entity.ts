import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: '' })
  description: string;

  @Column({ default: '' })
  prompt: string;

  @Column('simple-array', { default: [] })
  skillIds: string[];

  @Column('simple-array', { default: [] })
  mcpConfigIds: string[];

  @Column('simple-array', { default: [] })
  knowledgeBaseIds: string[];

  @Column('simple-array', { default: [] })
  linkedAgentIds: string[];

  @Column()
  modelId: string; // 关联大模型配置ID

  @Column({ default: false })
  published: boolean;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: string | null;

  /** 预留 登录主体，来自 x-agent-hub-user 等 */
  @Column({ type: 'varchar', nullable: true })
  ownerSubject: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: string;
}
