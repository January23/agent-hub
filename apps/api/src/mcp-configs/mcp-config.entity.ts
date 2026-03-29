import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { McpConfig } from './mcp-configs.types';

@Entity()
export class McpConfigEntity implements McpConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: '' })
  description: string;

  @Column({ default: '{}' })
  transportJson: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: string;
}
