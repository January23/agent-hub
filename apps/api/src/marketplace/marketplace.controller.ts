import { Controller, Get, Query } from '@nestjs/common';
import {
  RequestIdentity,
  type RequestIdentityPayload,
} from '../auth/request-identity.decorator';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  @Get('agents')
  async search(
    @Query('q') q: string | undefined,
    @RequestIdentity() identity: RequestIdentityPayload,
  ) {
    return this.marketplace.search(q, identity);
  }
}
