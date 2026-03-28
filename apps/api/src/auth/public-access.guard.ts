import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';

/**
 * 内网 SSO/OIDC 接入前：不做校验，全部放行。
 * TODO: 替换为校验网关转发的 JWT / Session 的 Guard。
 */
@Injectable()
export class PublicAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    void context;
    return true;
  }
}
