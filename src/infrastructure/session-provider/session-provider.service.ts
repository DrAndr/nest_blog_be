import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RedisProviderService } from '@/infrastructure/redis-provider/redis-provider.service';
import { User } from '@prisma/__generated__/client';
import type { Request, Response } from 'express';
import { RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionProviderService {
  private readonly redis!: RedisClientType;
  private readonly sessionPrefix!: string;
  private readonly userPrefix: string = 'user';

  public constructor(
    private readonly redisProviderService: RedisProviderService,
    private readonly configService: ConfigService,
  ) {
    this.redis = this.redisProviderService.getClient();
    this.sessionPrefix =
      this.configService.getOrThrow<string>('SESSION_FOLDER');
  }

  /**
   * Write and save session.
   * @param req
   * @param user
   * @returns boolean
   */
  async saveSession(req: Request, user: User): Promise<boolean> {
    /**
     * set userId to current session
     */
    req.session.userId = user.id;

    /**
     * Save updated session
     */
    await new Promise<void>((resolve, reject): void => {
      req.session.save((err) => {
        if (err)
          reject(new InternalServerErrorException('Save session failed.'));
        else resolve();
      });
    });

    /**
     * Add current sessionId to the user sessions set
     */
    await this.redis.sAdd(this.getUserSessionSetKey(user.id), req.sessionID);

    return true;
  }

  /**
   * Attempt to destroy session.
   * @param req
   * @param userId string
   * @returns boolean
   */
  async destroySession(req: Request, userId: string): Promise<boolean> {
    /**
     * Remove current session from the user session list by sessionID
     */
    await this.redis.sRem(this.getUserSessionSetKey(userId), req.sessionID);

    /**
     * Destroy single session by session ID
     */
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          return reject(
            new InternalServerErrorException('Destroy session failed.'),
          );
        }

        resolve(true);
      });
    });
  }

  async destroyAll(userId: string): Promise<void> {
    /**
     * Get list of user sessions linked belong to user by ID
     */
    const sessions = await this.redis.sMembers(
      this.getUserSessionSetKey(userId),
    );

    /**
     * Delete all user sessions (activated on different devices)
     */
    await Promise.all(
      sessions.map((sid) => this.redis.del(`${this.sessionPrefix}:${sid}`)),
    );

    /**
     * Delete list of the user sessions
     */
    await this.redis.del(this.getUserSessionSetKey(userId));
  }

  private getUserSessionSetKey = (userId: string): string =>
    `${this.userPrefix}:${this.sessionPrefix}:${userId}`;
}
