import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {
  RequestIdentity,
  type RequestIdentityPayload,
} from './auth/request-identity.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health(): { ok: true } {
    return { ok: true };
  }

  /** 预留：对接内网登录后可返回真实用户；当前仅回显可选请求头 */
  @Get('auth/me')
  me(
    @RequestIdentity() identity: RequestIdentityPayload,
  ): RequestIdentityPayload {
    return identity;
  }
}
