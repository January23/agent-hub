import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import type { McpConfig } from '../mcp-configs/mcp-configs.types';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import JSON5 from 'json5';

export interface FunctionCall {
  name: string;
  parameters: Record<string, any>;
}

export interface McpExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

@Injectable()
export class McpExecutorService {
  private clientCache = new Map<string, { client: Client; process?: ChildProcess }>();

  /**
   * 修复大模型输出的坏 JSON
   */
  private fixAndParseJson(input: string): any {
    try {
      // 1. 先尝试正常解析
      return JSON.parse(input);
    } catch (e) {
      try {
        // 2. 尝试用 JSON5 修复（支持单引号、换行、注释）
        return JSON5.parse(input);
      } catch (e2) {
        try {
          // 3. 终极修复：处理换行、未转义字符
          let fixed = input
            .replace(/\n/g, '\\n')         // 真实换行 → \n
            .replace(/\r/g, '')
            .replace(/\\n/g, '\\n')        // 统一换行
            .replace(/'/g, '"')            // 单引号 → 双引号
            .replace(/,\s*}/g, '}')        // 删除尾逗号
            .replace(/,\s*]/g, ']');

          return JSON.parse(fixed);
        } catch (e3) {
          console.error('JSON 格式无法修复:', e3);
          throw new Error('JSON 格式无法修复');
        }
      }
    }
  }

  /**
   * 解析大模型返回的函数调用指令
   */
  parseFunctionCall(content: string): FunctionCall | null {
    const match = content.match(/<\|FunctionCallBegin\|>([\s\S]*?)<\|FunctionCallEnd\|>/);
    if (!match?.[1]) return null;

    try {
      // const calls = this.fixAndParseJson(match[1].trim());
      const calls = JSON.parse(match[1].trim());
      return Array.isArray(calls) ? calls[0] : calls;
    } catch (e) {
      console.error('Failed to parse function call:', e);
      return null;
    }
  }

  /**
   * 执行MCP调用
   */
  async execute(mcpConfig: McpConfig, functionCall: FunctionCall): Promise<McpExecutionResult> {
    try {
      // 解析Transport JSON为标准MCP配置
      let transportConfig: McpServerConfig;
      try {
        transportConfig = JSON.parse(mcpConfig.transportJson || '{}');
      } catch (e) {
        return {
          success: false,
          error: 'MCP配置错误：Transport JSON格式无效',
        };
      }
      
      if (!transportConfig.command || typeof transportConfig.command !== 'string') {
        return {
          success: false,
          error: 'MCP配置错误：command字段必须是有效的字符串',
        };
      }
      
      if (!Array.isArray(transportConfig.args)) {
        transportConfig.args = [];
      }

      // 获取或创建MCP客户端
        const cacheKey = mcpConfig.id;
        let clientInstance = this.clientCache.get(cacheKey);
        
        if (!clientInstance) {
          // 直接使用MCP SDK创建STDIO传输，SDK会自动管理进程
          const env: Record<string, string> = {};
          
          // 先复制系统环境变量
          Object.entries(process.env).forEach(([key, value]) => {
            if (typeof value === 'string') {
              env[key] = value;
            }
          });
          
          // 再覆盖MCP配置里的环境变量
          if (transportConfig.env && typeof transportConfig.env === 'object') {
            Object.entries(transportConfig.env).forEach(([key, value]) => {
              if (typeof value === 'string') {
                env[key] = value;
              }
            });
          }

          console.log(`[MCP启动] 命令: ${transportConfig.command}, 参数:`, transportConfig.args, '环境变量:', {
            EMAIL_USER: env.EMAIL_USER ? '已设置' : '未设置',
            EMAIL_TYPE: env.EMAIL_TYPE,
          });

          const transport = new StdioClientTransport({
            command: transportConfig.command,
            args: transportConfig.args || [],
            env,
          });

          const client = new Client({ name: 'agent-hub', version: '1.0.0' });
          await client.connect(transport);

          const childProcess = (transport as any).process as ChildProcess | undefined;
          
          clientInstance = { 
            client, 
            process: childProcess,
          };
          this.clientCache.set(cacheKey, clientInstance);

          // 进程退出时清理缓存
          if (childProcess) {
            childProcess.on('exit', () => {
              this.clientCache.delete(cacheKey);
            });
          }
        }

        if (!clientInstance) {
          throw new Error('MCP客户端初始化失败');
        }

        // 预处理工具调用：兼容大模型返回的错误格式
        let toolName = functionCall.name;
        let toolParams = { ...functionCall.parameters };

        // 兼容格式1：parameters里有action字段（把action作为真实工具名）
        if (toolParams.action && typeof toolParams.action === 'string') {
          toolName = toolParams.action;
          delete toolParams.action;
        }

        // 移除所有值为空字符串的参数
        Object.keys(toolParams).forEach(key => {
          if (toolParams[key] === '' || toolParams[key] === null || toolParams[key] === undefined) {
            delete toolParams[key];
          }
        });



        console.log(`[MCP调用] 工具名: ${toolName}, 参数:`, toolParams);

        // 工具权限校验：仅允许调用已启用的工具
        if (mcpConfig.enabledTools && mcpConfig.enabledTools.length > 0) {
          if (!mcpConfig.enabledTools.includes(toolName)) {
            return {
              success: false,
              error: `工具【${toolName}】未被启用，允许使用的工具：${mcpConfig.enabledTools.join('、')}`,
            };
          }
        }

        // 调用MCP工具
        const result = await clientInstance.client.callTool({
          name: toolName,
          arguments: toolParams,
        });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
        console.error('[MCP调用错误] 完整错误信息:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'MCP调用失败',
        };
      }
  }

  /**
   * 清理所有MCP客户端连接
   */
  async cleanup(): Promise<void> {
    for (const [key, { client, process }] of this.clientCache.entries()) {
      await client.close();
      if (process) {
        process.kill();
      }
      this.clientCache.delete(key);
    }
  }
}
