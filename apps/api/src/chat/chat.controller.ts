import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import OpenAI from 'openai';
import { AgentsService } from '../agents/agents.service';
import type { Agent } from '../agents/agents.types';
import { SkillsService } from '../skills/skills.service';
import { McpConfigsService } from '../mcp-configs/mcp-configs.service';
import type { McpConfig } from '../mcp-configs/mcp-configs.types';
import { KnowledgeBasesService } from '../knowledge-bases/knowledge-bases.service';
import { McpExecutorService } from '../mcp/mcp-executor.service';
import { ModelConfigsService } from '../model-configs/model-configs.service';
import { ChatSessionService } from './chat-session.service';
import type { ChatStreamBody } from './chat.types';

function sseWrite(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

@Controller('chat')
export class ChatController {
  constructor(
    private readonly agents: AgentsService,
    private readonly skills: SkillsService,
    private readonly mcpConfigs: McpConfigsService,
    private readonly knowledgeBases: KnowledgeBasesService,
    private readonly mcpExecutor: McpExecutorService,
    private readonly modelConfigs: ModelConfigsService,
    private readonly chatSessionService: ChatSessionService,
  ) {}

  /**
   * SSE 流式对话接口，使用用户配置的大模型
   * TODO: 按 viewer + agentId 限流。
   */
  @Post(':agentId/stream')
  async stream(
    @Param('agentId') agentId: string,
    @Body() body: ChatStreamBody,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const agent = await this.agents.get(agentId);
    if (!agent) {
      res.status(404).json({ message: `Agent ${agentId} not found` });
      return;
    }

    // 获取关联的大模型配置
    const modelConfig = await this.modelConfigs.get(agent.modelId);
    if (!modelConfig) {
      res.status(404).json({ message: `Agent 关联的大模型配置不存在` });
      return;
    }

    const mode = body.mode ?? 'production';
    const incomingMessages = body.messages ?? [];
    let sessionId = body.sessionId;
    
    // 加载或创建会话
    let session = sessionId ? this.chatSessionService.get(sessionId) : null;
    let isNewSession = false;
    
    if (!session) {
      session = this.chatSessionService.create(agentId, incomingMessages);
      sessionId = session.id;
      isNewSession = true;
    } else {
      // 检查会话所属agent是否匹配
      if (session.agentId !== agentId) {
        res.status(400).json({ message: `会话不属于当前Agent` });
        return;
      }

      // 检查是否超过15轮对话限制
      if (session.round >= 15) {
        res.status(200);
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        
        sseWrite(res, 'meta', {
          agentId: agent.id,
          mode,
          sessionId,
          model: {
            provider: modelConfig.provider,
            model: modelConfig.model,
            temperature: modelConfig.temperature,
          },
        });

        sseWrite(res, 'token', { 
          text: '⚠️ 当前会话已超过15轮对话限制，请开启新会话继续交流。' 
        });
        sseWrite(res, 'done', {});
        res.end();
        return;
      }

      // 追加用户最新消息到会话
      const latestUserMessage = incomingMessages[incomingMessages.length - 1];
      if (latestUserMessage?.role === 'user' && sessionId) {
        this.chatSessionService.appendMessage(sessionId, latestUserMessage);
      }
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    sseWrite(res, 'meta', {
      agentId: agent.id,
      mode,
      sessionId,
      model: {
        provider: modelConfig.provider,
        model: modelConfig.model,
        temperature: modelConfig.temperature,
      },
    });

    try {
      const apiKey = modelConfig.apiKey;
      const baseURL = modelConfig.baseUrl;

      if (!baseURL) {
        throw new Error('请配置大模型 API 地址');
      }

      const openai = new OpenAI({
        apiKey,
        baseURL,
        timeout: 120000,
      });

      // 构建增强的系统提示词
      const buildSystemPrompt = async () => {
        let systemPrompt = agent.prompt;

        // 拼接 Skills 信息
        if (agent.skillIds?.length > 0) {
          const skills = await Promise.all(agent.skillIds.map((id) => this.skills.get(id)));
          const validSkills = skills.filter(Boolean);
          if (validSkills.length > 0) {
            systemPrompt +=
              '\n\n## 可用技能\n你可以根据用户问题选择使用以下技能：\n' +
              validSkills
                .map(
                  (skill) =>
                    `- ${skill?.name}: ${skill?.description}\n  技能详情：${skill?.definition}`,
                )
                .join('\n');
          }
        }

        // 拼接 MCP 配置信息
        if (agent.mcpConfigIds?.length > 0) {
          const mcpConfigs = await Promise.all(agent.mcpConfigIds.map((id) =>
            this.mcpConfigs.get(id),
          ));
          const validMcpConfigs = mcpConfigs.filter(Boolean);
          if (validMcpConfigs.length > 0) {
            systemPrompt +=
              '\n\n## 可用MCP工具\n你可以调用以下MCP服务来完成任务：\n' +
              validMcpConfigs
                .map((mcp) => {
                  let toolsInfo = '';
                  if (mcp?.enabledTools && mcp.enabledTools.length > 0) {
                    toolsInfo = `\n  可用工具：${mcp.enabledTools.join('、')}`;
                  }
                  return `- ${mcp?.name}: ${mcp?.description}${toolsInfo}`;
                })
                .join('\n');
          }
        }

        // 拼接知识库信息
        if (agent.knowledgeBaseIds?.length > 0) {
          const knowledgeBases = await Promise.all(agent.knowledgeBaseIds.map((id) =>
            this.knowledgeBases.get(id),
          ));
          const validKnowledgeBases = knowledgeBases.filter(Boolean);
          if (validKnowledgeBases.length > 0) {
            systemPrompt +=
              '\n\n## 关联知识库\n你可以使用以下知识库的内容来回答用户问题：\n' +
              validKnowledgeBases
                .map(
                  (kb) =>
                    `- ${kb?.name}: ${kb?.description}\n  存储位置：${kb?.storageHint}`,
                )
                .join('\n');
          }
        }

        // 拼接关联子Agent信息
        if (agent.linkedAgentIds?.length > 0) {
          const linkedAgents = await Promise.all(
            agent.linkedAgentIds.map((id) => this.agents.get(id)),
          );
          const validLinkedAgents = linkedAgents.filter(Boolean);
          if (validLinkedAgents.length > 0) {
            systemPrompt +=
              '\n\n## 可调用子Agent\n你可以将适合的任务分发给以下子Agent处理：\n' +
              validLinkedAgents
                .map(
                  (subAgent) =>
                    `- ${subAgent?.name}: ${subAgent?.description}\n  能力描述：${subAgent?.prompt ? subAgent.prompt.substring(0, 200) + (subAgent.prompt.length > 200 ? '...' : '') : ''}`,
                )
                .join('\n');
          }
        }

        // 添加处理流程指令，引导大模型正确使用资源
        systemPrompt += `\n\n## 处理流程说明
请严格按照以下流程处理用户问题：
1. 先理解用户的真实意图
2. 判断是否需要将复杂任务拆分为多个子任务
3. 判断是否需要调用上方列出的技能、MCP工具来完成任务
4. 判断是否需要检索上方关联的知识库获取信息
5. 判断是否需要将任务分发给上方列出的子Agent处理
6. 如果需要调用工具，必须使用以下格式返回：
<|FunctionCallBegin|>
[{"name":"工具名","parameters":{"参数名":"参数值"}}]
<|FunctionCallEnd|>
⚠️ 重要规则：
- 工具调用分为两种：MCP工具调用 和 子Agent调用
- 调用MCP工具时，name字段填工具名称（如send_email、get_recent_emails等）
- 调用子Agent时，name字段填子Agent名称（如"人员信息agent"等），parameters填{"query": "用户问题内容"}
- parameters里严格使用工具/Agent定义的参数名，不要自己发明参数：
  * 发送邮件send_email工具，正文用text字段，不要用content
  * 调用子Agent时，参数固定为query，值为用户的问题
- 不要加额外的action字段
- 不要传入值为空的参数，不需要的参数不要写
7. 调用工具后，我会返回工具执行结果，你再根据结果继续处理
8. 所有关于日期、星期、时间、天气、实时信息的问题，必须先调用 tavily_search 工具查询，禁止直接回答
9. 完成所有必要操作后，再整合结果给出最终回答

## 当前用户问题
用户最新请求：${session.messages[session.messages.length - 1]?.content || ''}
请根据以上流程和可用资源来处理用户问题。`;

        return systemPrompt;
      };

      // 多轮调用循环
      let currentMessages = [...session.messages];
      let fullFinalResponse = '';
      let maxRounds = 3; // 最多3轮工具调用，防止死循环

      while (maxRounds > 0) {
        maxRounds--;

        console.log(
          `[LLM Request] Agent: ${agent.name} (${agent.id}), Provider: ${modelConfig.provider}, Model: ${modelConfig.model}, Round ${4 - maxRounds}, Messages:`,
          currentMessages,
        );

        // 构建请求参数并打印
          const messages = [
            { role: 'system' as const, content: await buildSystemPrompt() },
            ...currentMessages,
          ] as any;
          console.log(`
[LLM 完整请求参数]
模型: ${modelConfig.model}
温度: ${modelConfig.temperature ?? 0.2}
消息列表:
${JSON.stringify(messages, null, 2)}
`);
          
          const stream = await openai.chat.completions.create({
            model: modelConfig.model,
            temperature: modelConfig.temperature ?? 0.2,
            messages,
            stream: true
          });

        let fullResponse = '';
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              fullResponse += text;
              // 所有轮次的内容都输出给用户，包括工具调用指令和最终回答
              sseWrite(res, 'token', { text });
            }
          }

        console.log(
          `[LLM Response] Agent: ${agent.name} (${agent.id}), Round ${4 - maxRounds} Output:\n${fullResponse}\n`,
        );

        // 检查是否有函数调用
        const functionCall = this.mcpExecutor.parseFunctionCall(fullResponse);
        if (!functionCall) {
          // 没有函数调用，直接返回结果
          fullFinalResponse = fullResponse;
          break;
        }

        // 执行工具/Agent调用
          sseWrite(res, 'token', { text: `\n\n🔧 正在调用: ${functionCall.name}...\n` });

          let result;
          let isAgentCall = false;

          // 第一步：先匹配MCP工具
          const allMcpConfigs = (await Promise.all(agent.mcpConfigIds.map((id) => this.mcpConfigs.get(id)))).filter(Boolean) as McpConfig[];
          let mcpConfig: McpConfig | null = null;

          for (const config of allMcpConfigs) {
            // 检查工具是否在该MCP的启用列表里，列表为空表示不限制
            if (!config.enabledTools || config.enabledTools.length === 0 || config.enabledTools.includes(functionCall.name)) {
              mcpConfig = config;
              break;
            }
          }

          if (mcpConfig) {
            // 执行MCP调用
            result = await this.mcpExecutor.execute(mcpConfig, functionCall);
          } else {
            // 第二步：匹配子Agent调用
            const allLinkedAgents = (await Promise.all(agent.linkedAgentIds.map((id) => this.agents.get(id)))).filter(Boolean) as Agent[];
            let targetAgent: Agent | null = null;

            for (const linkedAgent of allLinkedAgents) {
              if (linkedAgent?.name === functionCall.name) {
                targetAgent = linkedAgent;
                break;
              }
            }

            if (targetAgent) {
                isAgentCall = true;
                sseWrite(res, 'token', { text: `ℹ️ 检测到子Agent调用，正在执行${targetAgent.name}...\n` });
                
                // 内部调用子Agent，只需要传递用户query参数
                const userQuery = functionCall.parameters.query || '';
                
                // 获取子Agent关联的大模型配置
                const agentModelConfig = await this.modelConfigs.get(targetAgent.modelId);
                if (!agentModelConfig) {
                  result = {
                    success: false,
                    error: `子Agent ${targetAgent.name} 关联的大模型配置不存在`,
                  };
                } else {
                  try {
                    // 构建子Agent的完整动态系统提示词，包含它自己的技能、MCP、知识库
                    let agentSystemPrompt = targetAgent.prompt;
                    
                    // 拼接子Agent自己的Skills信息
                    if (targetAgent.skillIds?.length > 0) {
                      const skills = await Promise.all(targetAgent.skillIds.map((id) => this.skills.get(id)));
                      const validSkills = skills.filter(Boolean);
                      if (validSkills.length > 0) {
                        agentSystemPrompt += '\n\n## 可用技能\n你可以根据用户问题选择使用以下技能：\n' + 
                          validSkills.map((skill) => 
                            `- ${skill?.name}: ${skill?.description}\n  技能详情：${skill?.definition}`
                          ).join('\n');
                      }
                    }
                    
                    // 拼接子Agent自己的MCP配置信息
                    if (targetAgent.mcpConfigIds?.length > 0) {
                      const mcpConfigs = await Promise.all(targetAgent.mcpConfigIds.map((id) => this.mcpConfigs.get(id)));
                      const validMcpConfigs = mcpConfigs.filter(Boolean);
                      if (validMcpConfigs.length > 0) {
                        agentSystemPrompt += '\n\n## 可用MCP工具\n你可以调用以下MCP服务来完成任务：\n' + 
                          validMcpConfigs.map((mcp) => {
                            let toolsInfo = '';
                            if (mcp?.enabledTools && mcp.enabledTools.length > 0) {
                              toolsInfo = `\n  可用工具：${mcp.enabledTools.join('、')}`;
                            }
                            return `- ${mcp?.name}: ${mcp?.description}${toolsInfo}`;
                          }).join('\n');
                      }
                    }
                    
                    // 拼接子Agent自己的知识库信息
                    if (targetAgent.knowledgeBaseIds?.length > 0) {
                      const knowledgeBases = await Promise.all(targetAgent.knowledgeBaseIds.map((id) => this.knowledgeBases.get(id)));
                      const validKnowledgeBases = knowledgeBases.filter(Boolean);
                      if (validKnowledgeBases.length > 0) {
                        agentSystemPrompt += '\n\n## 关联知识库\n你可以使用以下知识库的内容来回答问题：\n' + 
                          validKnowledgeBases.map((kb) => 
                            `- ${kb?.name}: ${kb?.description}\n  存储位置：${kb?.storageHint}`
                          ).join('\n');
                      }
                    }

                    // 子Agent处理流程说明
                    agentSystemPrompt += `\n\n## 处理流程说明
请严格按照以下流程处理用户问题：
1. 先理解用户的真实意图
2. 优先使用上面关联的知识库内容回答
3. 需要时可以调用上面列出的技能、MCP工具
4. 完成所有必要操作后，再给出最终回答

用户问题：${userQuery}
请根据以上信息回答用户问题。`;

                    const openai = new OpenAI({
                      apiKey: agentModelConfig.apiKey,
                      baseURL: agentModelConfig.baseUrl,
                      timeout: 120000,
                    });

                    // 调用子Agent大模型，包含完整的动态提示词，使用流式输出
                    const agentStream = await openai.chat.completions.create({
                      model: agentModelConfig.model,
                      temperature: agentModelConfig.temperature ?? 0.2,
                      messages: [
                        { role: 'system', content: agentSystemPrompt },
                        { role: 'user', content: userQuery },
                      ],
                      stream: true,
                    });

                    let agentAnswer = '';
                    for await (const chunk of agentStream) {
                      const text = chunk.choices[0]?.delta?.content || '';
                      if (text) {
                        agentAnswer += text;
                        // 将子Agent的流式输出直接传递给用户
                        sseWrite(res, 'token', { text });
                      }
                    }
                    result = {
                      success: true,
                      data: {
                        agentName: targetAgent.name,
                        answer: agentAnswer,
                      },
                    };
                  } catch (error) {
                    result = {
                      success: false,
                      error: `子Agent调用失败: ${error instanceof Error ? error.message : '未知错误'}`,
                    };
                  }
                }
            } else {
              // 都找不到的话报错
              const allEnabledTools = allMcpConfigs.flatMap(c => c.enabledTools || []).join('、');
              const allLinkedAgentNames = allLinkedAgents.map(a => a?.name).filter(Boolean).join('、');
              sseWrite(res, 'token', { text: `❌ 未找到支持的工具或子Agent\n` });
              sseWrite(res, 'token', { text: `所有启用的工具：${allEnabledTools || '无'}\n` });
              sseWrite(res, 'token', { text: `所有关联的子Agent：${allLinkedAgentNames || '无'}\n` });
              break;
            }
          }

        if (result.success) {
          sseWrite(res, 'token', { text: `✅ 工具调用成功\n\n` });
          // 把工具调用结果加入消息历史
          currentMessages = [
            ...currentMessages,
            { role: 'assistant', content: fullResponse },
            {
              role: 'user',
              content: `工具执行结果：\n${JSON.stringify(result.data, null, 2)}`,
            },
          ];
        } else {
          sseWrite(res, 'token', {
            text: `❌ 工具调用失败: ${result.error}\n`,
          });
          break;
        }
      }

      console.log(
        `[LLM Final Response] Agent: ${agent.name} (${agent.id}), Full Output:\n${fullFinalResponse}\n`,
      );

      // 更新会话，保存最新的对话历史
      if (fullFinalResponse && sessionId) {
        currentMessages.push({
          role: 'assistant',
          content: fullFinalResponse,
        });
        this.chatSessionService.updateMessages(sessionId, currentMessages);
      }
    } catch (error) {
      console.error(
        `[LLM Error] Agent: ${agent.name} (${agent.id}), Error:`,
        error,
      );
      sseWrite(res, 'error', {
        message: error instanceof Error ? error.message : '调用大模型失败',
      });
    } finally {
      sseWrite(res, 'done', {});
      res.end();
    }
  }
}
