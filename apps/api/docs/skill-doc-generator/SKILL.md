---
name: "doc-generator"
description: "自动生成各类技术文档，包括API文档、使用说明、接口文档、README等。Invoke when user needs to generate documentation, or asks to write README, API docs, usage guides."
---

# 文档生成技能

## 功能说明
自动根据代码结构、接口定义、需求描述生成规范的技术文档。

## 适用场景
- 用户要求生成项目README文档
- 需要生成API接口文档
- 需要编写系统使用说明、操作手册
- 要求从代码自动提取信息生成文档
- 需要生成架构设计文档、技术方案

## 使用方法
直接调用本技能，提供以下信息：
1. 文档类型（README/API文档/使用说明/其他）
2. 需要生成文档的代码路径或需求描述
3. 文档格式要求（Markdown/HTML/其他）

## 支持生成的文档类型示例

### 1. 技术栈清单
```markdown
## 🔧 技术栈
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
```

### 2. API接口文档
```markdown
## 🚀 核心接口清单

### Agent 管理接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/agents` | 获取Agent列表 |
| GET | `/agents/:id` | 获取单个Agent详情 |
| POST | `/agents` | 创建Agent |
| PATCH | `/agents/:id` | 更新Agent配置 |
| DELETE | `/agents/:id` | 删除Agent |
```

### 3. README项目说明
包含项目介绍、功能特性、快速开始、部署指南、开发规范等内容。

### 4. 其他技术文档
- 系统架构设计文档
- 部署运维手册
- 功能使用说明
- 数据库设计文档
- 技术方案文档

## 输出规范
- 严格遵循Markdown格式
- 结构清晰，层次分明
- 内容准确，符合实际业务逻辑
- 包含必要的示例代码和说明
- 表格对齐美观，可读性强
