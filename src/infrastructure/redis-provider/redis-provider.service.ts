import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@db/__generated__/client';
import { createClient, type RedisClientType } from 'redis';
import { REDIS_CLIENT } from '@/infrastructure/redis-provider/common/constants';

@Injectable()
export class RedisProviderService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(RedisProviderService.name);

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: RedisClientType,
  ) {}

  public async onModuleInit() {
    this.redisClient.on('error', (err) =>
      this.logger.error('Redis error', err),
    );

    this.redisClient.on('reconnecting', () =>
      this.logger.warn('Redis reconnecting...'),
    );

    this.redisClient.on('connect', () => this.logger.log('Redis connected'));

    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
  }

  async onApplicationShutdown() {
    if (this.redisClient.isOpen) {
      await this.redisClient.quit();
      this.logger.log('Redis connection closed');
    }
  }

  public getClient(): RedisClientType {
    return this.redisClient;
  }
}
