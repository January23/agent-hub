import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 内网 SSO / OIDC 接入前：不做登录校验，全部放行。
 * TODO: 校验 cookie / Bearer；未登录重定向企业登录；可向 API 透传 Identity（Header）。
 */
export function middleware(request: NextRequest) {
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
