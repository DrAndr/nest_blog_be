import { Module } from '@nestjs/common';
import { SessionProviderService } from './session-provider.service';
import { RedisProviderModule } from '@/infrastructure/redis-provider/redis-provider.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  controllers: [],
  providers: [SessionProviderService, ConfigService],
  exports: [SessionProviderService],
  imports: [RedisProviderModule],
})
export class SessionProviderModule {}
