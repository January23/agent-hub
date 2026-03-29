"use client";

import {
  AppstoreOutlined,
  BookOutlined,
  CloudServerOutlined,
  HomeOutlined,
  RobotOutlined,
  ShopOutlined,
  ToolOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import { App, ConfigProvider, Layout, Menu, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const { Header, Sider, Content } = Layout;

function menuKeyFromPath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "/";
  const top = pathname.split("/")[1];
  switch (top) {
    case "agents":
      return "/agents";
    case "skills":
      return "/skills";
    case "mcp-configs":
      return "/mcp-configs";
    case "model-configs":
      return "/model-configs";
    case "knowledge-bases":
      return "/knowledge-bases";
    case "marketplace":
      return "/marketplace";
    case "chat":
      return "/marketplace";
    default:
      return "/";
  }
}

const menuItems = [
  { key: "/", icon: <HomeOutlined />, label: <Link href="/">首页</Link> },
  { key: "/agents", icon: <RobotOutlined />, label: <Link href="/agents">Agent</Link> },
  { key: "/skills", icon: <ToolOutlined />, label: <Link href="/skills">Skills</Link> },
  {
    key: "/mcp-configs",
    icon: <CloudServerOutlined />,
    label: <Link href="/mcp-configs">MCP</Link>,
  },
  {
    key: "/model-configs",
    icon: <ApiOutlined />,
    label: <Link href="/model-configs">大模型</Link>,
  },
  {
    key: "/knowledge-bases",
    icon: <BookOutlined />,
    label: <Link href="/knowledge-bases">知识库</Link>,
  },
  {
    key: "/marketplace",
    icon: <ShopOutlined />,
    label: <Link href="/marketplace">市场</Link>,
  },
];

export function RootShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const selected = menuKeyFromPath(pathname);

  return (
    <ConfigProvider locale={zhCN} theme={{ algorithm: theme.defaultAlgorithm }}>
      <App>
        <Layout style={{ minHeight: "100vh" }}>
          <Sider breakpoint="lg" collapsedWidth={0} theme="dark" width={220}>
            <div
              style={{
                padding: "16px 20px",
                color: "rgba(255,255,255,0.92)",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              <AppstoreOutlined style={{ marginRight: 8 }} />
              Agent Hub
            </div>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[selected]}
              style={{ borderInlineEnd: 0 }}
              items={menuItems}
            />
          </Sider>
          <Layout>
            <Header
              style={{
                background: "#fff",
                paddingInline: 24,
                lineHeight: "64px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              内网 Agent 市场 · 配置与对话
            </Header>
            <Content style={{ margin: 24, maxWidth: 1200 }}>{children}</Content>
          </Layout>
        </Layout>
      </App>
    </ConfigProvider>
  );
}
