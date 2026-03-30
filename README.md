# Agent Hub

企业级智能Agent开发与运行平台，支持动态提示词、MCP工具调用、子Agent编排、知识库等完整能力。

## ✨ 核心特性

### 🤖 智能Agent编排
- **可视化Agent配置**：低代码方式配置Agent的提示词、技能、MCP工具、知识库、关联子Agent
- **动态提示词生成**：自动拼接所有关联资源，无需手动处理
- **多轮工具调用**：自动识别并执行工具调用，支持最多3轮多轮交互
- **子Agent调度**：内部调用关联子Agent，无需额外部署进程，支持多层级Agent编排

### 🔧 MCP生态兼容
- **标准MCP协议支持**：兼容所有符合Model Context Protocol的工具
- **可视化MCP配置**：页面化管理MCP服务，无需修改配置文件
- **工具权限控制**：可配置每个MCP启用的工具列表，精细化权限控制
- **自动执行与结果回传**：自动调用MCP工具并将结果返回给大模型继续处理

### 📚 知识库与技能
- **知识库管理**：关联外部知识库，支持RAG能力
- **自定义技能**：可扩展自定义技能库，复用通用能力
- **大模型配置化**：所有大模型配置统一管理，一处修改多处生效

### 🔐 企业级特性
- **配置全持久化**：所有配置存储到PostgreSQL数据库，重启不丢失
- **市场能力**：支持Agent上架/下架，内部共享能力
- **权限隔离**：不同Agent资源完全隔离，支持多租户扩展
- **SSE流式响应**：对话全程流式返回，体验流畅

## 🛠️ 技术栈

### 后端
| 技术 | 版本/说明 |
|------|----------|
| 框架 | NestJS 11 + TypeScript |
| 数据库 | PostgreSQL + TypeORM |
| 大模型 | OpenAI SDK + 标准MCP协议 |
| 运行环境 | Node.js >=22 |
| 包管理 | pnpm v10+ |

### 前端
| 技术 | 版本/说明 |
|------|----------|
| 框架 | Next.js 15 + React 18 |
| UI组件库 | Ant Design 5.x |
| 语言 | TypeScript |
| 状态管理 | React Hooks 原生 |
| 路由 | Next.js App Router |
| 请求库 | fetch API 原生 |

## 🚀 快速开始

### 前置要求
- Node.js >= 22
- PostgreSQL >= 14
- pnpm >= 10

### 本地开发
1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **配置数据库**
   - 启动PostgreSQL服务
   - 创建数据库`agent_hub`
   - （可选）在`apps/api/.env`配置数据库连接信息，默认配置：
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_USERNAME=postgres
     DB_PASSWORD=postgres
     DB_NAME=agent_hub
     ```

3. **启动服务**
   ```bash
   # 同时启动前后端
   pnpm dev
   
   # 或单独启动
   pnpm dev:api  # 后端运行在 http://localhost:3001
   pnpm dev:web  # 前端运行在 http://localhost:3000
   ```

4. **访问系统**
   打开浏览器访问 http://localhost:3000

### 初始配置
1. **配置大模型**：进入「大模型」页面，添加你的大模型配置（OpenAI/DeepSeek/其他兼容OpenAI协议的模型）
2. **配置MCP服务**：进入「MCP」页面，添加需要的MCP工具
3. **创建Agent**：进入「Agent」页面，创建你的第一个智能Agent，关联需要的资源
4. **开始对话**：点击「调试对话」即可和你的Agent对话

## 📖 核心概念

### Agent
智能体的核心单元，包含：
- 系统提示词：Agent的核心定位和能力描述
- 关联技能：Agent可以使用的自定义技能
- 关联MCP：Agent可以调用的外部工具
- 关联知识库：Agent可以访问的知识库
- 关联Agent：Agent可以调度的子Agent
- 大模型配置：Agent使用的大模型

### MCP
Model Context Protocol 工具，Agent可以调用的外部能力：
- 邮件发送
- 搜索工具
- 文件操作
- 其他任何符合MCP协议的服务

### 技能
Agent可以使用的内置能力，不需要额外进程，直接在平台内部实现。

### 知识库
Agent可以使用的外部知识库，支持RAG检索增强生成。

## 🔧 API接口

### Agent 管理接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/agents` | 获取Agent列表 |
| GET | `/agents/:id` | 获取单个Agent详情 |
| POST | `/agents` | 创建Agent |
| PATCH | `/agents/:id` | 更新Agent配置 |
| DELETE | `/agents/:id` | 删除Agent |
| POST | `/agents/:id/publish` | 发布Agent到市场 |
| POST | `/agents/:id/unpublish` | 下架Agent |

### 对话接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/chat/:agentId/stream` | SSE流式对话接口 |

### 大模型配置接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/model-configs` | 获取大模型配置列表 |
| GET | `/model-configs/:id` | 获取单个大模型配置 |
| POST | `/model-configs` | 创建大模型配置 |
| PATCH | `/model-configs/:id` | 更新大模型配置 |
| DELETE | `/model-configs/:id` | 删除大模型配置 |

### MCP 配置接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/mcp-configs` | 获取MCP配置列表 |
| GET | `/mcp-configs/:id` | 获取单个MCP配置 |
| POST | `/mcp-configs` | 创建MCP配置 |
| PATCH | `/mcp-configs/:id` | 更新MCP配置 |
| DELETE | `/mcp-configs/:id` | 删除MCP配置 |

### Skills 技能接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/skills` | 获取技能列表 |
| GET | `/skills/:id` | 获取单个技能详情 |
| POST | `/skills` | 创建技能 |
| PATCH | `/skills/:id` | 更新技能 |
| DELETE | `/skills/:id` | 删除技能 |

### 知识库接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/knowledge-bases` | 获取知识库列表 |
| GET | `/knowledge-bases/:id` | 获取单个知识库详情 |
| POST | `/knowledge-bases` | 创建知识库 |
| PATCH | `/knowledge-bases/:id` | 更新知识库 |
| DELETE | `/knowledge-bases/:id` | 删除知识库 |

## 📦 生产部署

### 构建项目
```bash
pnpm build
```

### 环境变量配置
需要配置的环境变量（可放在`apps/api/.env`）：
```env
# 数据库配置
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=agent_hub

# 其他配置
NODE_ENV=production
PORT=3001
```

### 启动生产服务
```bash
# 启动后端
cd apps/api && node dist/main.js

# 启动前端（使用Next.js生产服务）
cd apps/web && pnpm start
```

### Docker部署
可以自行编写Dockerfile进行容器化部署。

## 🤝 开发指南

### 目录结构
```
.
├── apps/
│   ├── api/          # 后端NestJS服务
│   └── web/          # 前端Next.js应用
├── packages/         # 公共包（可选）
├── pnpm-workspace.yaml
└── package.json
```

### 开发规范
- 后端代码遵循NestJS官方规范
- 前端使用TypeScript，类型完整
- 接口遵循RESTful规范
- 提交代码前执行`pnpm lint`检查

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

Copyright (c) 2025 yushi
