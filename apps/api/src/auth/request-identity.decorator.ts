import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export type RequestIdentityPayload = {
  /** 预留：工号、OIDC sub 等；由网关注入请求头后读取 */
  subject: string | null;
};

function headerString(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | null {
  const v = headers[name];
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') return v[0];
  return null;
}

/**
 * 从预留请求头解析身份，不校验签名；无头则为 null。
 * 对接企业登录后，可改为读取网关统一注入的头（或解析 Authorization）。
 */
export const RequestIdentity = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestIdentityPayload => {
    const req = ctx
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const { headers } = req;
    const subject =
      headerString(headers, 'x-agent-hub-user') ??
      headerString(headers, 'x-forwarded-user');
    return { subject };
  },
);
