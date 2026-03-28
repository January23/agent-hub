import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PublicAccessGuard } from './public-access.guard';

@Global()
@Module({
  providers: [{ provide: APP_GUARD, useClass: PublicAccessGuard }],
  exports: [],
})
export class AuthModule {}
