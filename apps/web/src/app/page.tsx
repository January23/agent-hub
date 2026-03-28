"use client";

import {
  BookOutlined,
  CloudServerOutlined,
  RobotOutlined,
  ShopOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Typography } from "antd";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        工作台
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        后端默认内存存储，进程重启会清空；生产环境可换数据库并接入真实 LLM、MCP、向量库。认证与限流已预留扩展点。
      </Typography.Paragraph>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={8}>
          <Card title={<><RobotOutlined /> Agent</>} variant="borderless">
            <Link href="/agents">配置 Agent</Link>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              提示词、Skills、MCP、知识库、关联 Agent、大模型与发布。
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card title={<><ToolOutlined /> Skills</>} variant="borderless">
            <Link href="/skills">管理 Skills</Link>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card title={<><CloudServerOutlined /> MCP</>} variant="borderless">
            <Link href="/mcp-configs">MCP 配置</Link>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card title={<><BookOutlined /> 知识库</>} variant="borderless">
            <Link href="/knowledge-bases">知识库</Link>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card title={<><ShopOutlined /> 市场</>} variant="borderless">
            <Link href="/marketplace">搜索与使用</Link>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              权限申请字段已预留，当前为占位放行。
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
