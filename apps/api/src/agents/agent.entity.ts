import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { AgentModelConfig } from './agents.types';

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

  @Column('jsonb')
  model: AgentModelConfig;

  @Column({ default: false })
  published: boolean;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: string | null;

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
