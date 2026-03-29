import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ModelConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // 配置名称，如"OpenAI GPT-4o"、"DeepSeek V3"

  @Column()
  provider: string; // 提供商，如openai-compatible、anthropic、gemini等

  @Column()
  model: string; // 模型名，如gpt-4o、deepseek-chat

  @Column({ type: 'float', default: 0.2 })
  temperature: number; // 默认温度

  @Column({ default: '' })
  apiKey: string; // API密钥

  @Column()
  baseUrl: string; // API地址

  @Column({ default: '' })
  description: string; // 描述

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: string;
}
