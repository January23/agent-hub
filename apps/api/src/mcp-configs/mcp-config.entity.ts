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

  @Column('simple-array', { default: [] })
  enabledTools: string[]; // 已启用的工具列表，如["send_email", "get_recent_emails"]

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: string;
}
