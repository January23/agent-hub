import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { Metadata } from "next";
import { RootShell } from "@/components/RootShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Hub",
  description: "Agent 市场",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <RootShell>{children}</RootShell>
        </AntdRegistry>
      </body>
    </html>
  );
}
