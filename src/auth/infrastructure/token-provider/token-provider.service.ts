import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { Token, TokenType } from '@prisma/__generated__/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class TokenProviderService {
  public constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create or update expired token in DB
   * @param email string
   * @param type string
   * @private
   * @return Promise<Token>
   */
  public async generateToken(email: string, type: TokenType): Promise<Token> {
    const existingToken = await this.getTokenByEmail(email, type);

    if (existingToken) {
      await this.deleteToken(existingToken.id);
    }

    return await this.createToken(email, type);
  }

  /**
   * Try to find existing tokens row by token string
   * @param token string
   * @param type string
   * @param email string
   * @private
   * @Return Promise<Token | null>
   */
  public async getToken(
    token: string,
    type: TokenType,
    email?: string,
  ): Promise<Token | null> {
    const where = {
      token,
      type,
    };

    if (email) {
      where['email'] = email;
    }
    return this.prismaService.token.findFirst({
      where: {
        token,
        type,
        email: email,
      },
    });
  }

  /**
   * Delete existing token by provided token record ID
   * @param id
   * @private
   */
  public deleteToken(id: string): Promise<Token | null> {
    return this.prismaService.token.delete({ where: { id } });
  }

  /**
   * Try to find existing tokens row by email
   * @param email string
   * @param type string
   * @private
   */
  private async getTokenByEmail(
    email: string,
    type: TokenType,
  ): Promise<Token | null> {
    return this.prismaService.token.findFirst({
      where: {
        email,
        type,
      },
    });
  }
  /**
   * Create new token based on provided email and type
   * @param email string
   * @param type string
   * @private
   */
  private async createToken(email: string, type: TokenType): Promise<Token> {
    const token = this.prismaService.token.create({
      data: {
        token: this.getTokenValue(type),
        email,
        type,
        expiresIn: this.expiresIn(type),
      },
    });

    if (!token) {
      throw new InternalServerErrorException('Token was not created.');
    }

    return token;
  }

  /**
   * Helper func, return Date + 1h, for tokens expiration field
   * @private
   */
  private expiresIn(type: TokenType) {
    return type !== TokenType.TWO_FACTOR
      ? new Date(Date.now() + 60 * 60 * 1000) // 1h
      : new Date(Date.now() + 60 * 15 * 1000); // 15min
  }

  /**
   * Helper func, return Date + 1h, for tokens expiration field
   * @private
   */
  private getTokenValue(type: TokenType) {
    return type !== TokenType.TWO_FACTOR
      ? uuid()
      : `${Math.floor(Math.random() * 900000 + 100000)}`;
  }
}
