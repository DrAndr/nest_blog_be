import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Token, TokenType } from '../../../prisma/__generated__/client';
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
   * @private
   * @Return Promise<Token | null>
   */
  public async getToken(token: string, type: TokenType): Promise<Token | null> {
    return this.prismaService.token.findFirst({
      where: {
        token,
        type,
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
        token: uuid(),
        email,
        type,
        expiresIn: this.expiresIn(),
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
  private expiresIn() {
    return new Date(Date.now() + 60 * 60 * 1000);
  }
}
