import { Controller, Get } from '@nestjs/common';
import { RedisProviderService } from './redis-provider.service';

@Controller('health/redis')
export class RedisHealthController {
  constructor(private readonly redis: RedisProviderService) {}

  @Get()
  async check() {
    const ok = await this.redis.ping();

    return {
      status: ok ? 'ok' : 'error',
    };
  }
}
