import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { RedisProviderModule } from '@/infrastructure/redis-provider/redis-provider.module';
import { RedisProviderService } from '@/infrastructure/redis-provider/redis-provider.service';
import type { RedisClientType } from 'redis';
import { MailerService } from '@nestjs-modules/mailer';
import { IAllHealthCheckResponse } from '@/health-check/libs/interfaces/all-helth-check.interface';
import statusStrVal from '@/health-check/libs/invertStatus';

@Injectable()
export class HealthCheckService {
  private redisClient: RedisClientType;
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisProviderService,
    private readonly mailerService: MailerService,
  ) {
    this.redisClient = this.redisService.getClient();
  }

  /** Prisma healthcheck */
  async database(): Promise<boolean> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /** Redis healthcheck */
  async redis(): Promise<boolean> {
    try {
      const res: string = await this.redisClient.ping();
      return res === 'PONG';
    } catch {
      return false;
    }
  }

  /** Mailer healthcheck */
  async mailer(): Promise<boolean> {
    try {
      const transporter = (this.mailerService as any).transporter;
      await transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  async all(): Promise<IAllHealthCheckResponse> {
    return {
      database: statusStrVal(await this.database()),
      redis: statusStrVal(await this.redis()),
      mailer: statusStrVal(await this.mailer()),
    };
  }
}
