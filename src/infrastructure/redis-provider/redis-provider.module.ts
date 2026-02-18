import { Global, Module } from '@nestjs/common';
import { RedisProviderService } from './redis-provider.service';
import { REDIS_CLIENT } from '@/infrastructure/redis-provider/common/constants';
import { createClient, RedisClientType } from 'redis';

@Global()
@Module({
  controllers: [],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async (connection: RedisClientType) =>
        createClient({
          socket: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
          },
          password: process.env.REDIS_PASSWORD,
        }),
    },
    RedisProviderService,
  ],
  exports: [RedisProviderService],
})
export class RedisProviderModule {}
