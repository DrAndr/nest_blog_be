import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuid } from 'uuid';
import { TokenType } from '../../../prisma/__generated__/enums';
import type { Token, User } from '../../../prisma/__generated__/client';
import { ConfirmationDto } from './dto/confirmation.dto';
import type { Request } from 'express';
import { UserService } from '../../user/user.service';
import { saveSession } from '../utils/saveSession';

@Injectable()
export class EmailVerificationService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

  public async sendVerificationToken(user: User) {}

  public async newVerification(
    req: Request,
    { token }: ConfirmationDto,
  ): Promise<User> {
    const tokenData = await this.validateToken(token);
    const user = await this.verifyUser(tokenData.email);

    return this.authenticateUser(req, user);
  }

  /**
   * Check is token exist in DB and return found token entity
   * Created for decomposition the newVerification method.
   * @param token
   * @private Promise<Token>
   */
  private async validateToken(token: string): Promise<Token> {
    const existingToken = await this.getVerificationToken(token);

    if (!existingToken) {
      throw new NotFoundException('Token not found.');
    }

    // check if token expired
    if (new Date(existingToken.expiresIn) < new Date()) {
      throw new BadRequestException('Token has been expired.');
    }
    return existingToken;
  }

  /**
   * get user by email and update user status isVerified to TRUE
   * Created for decomposition the newVerification method.
   * @param email
   * @private Promise<User>
   */
  private async verifyUser(email: string): Promise<User> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Not found User by token.');
    }

    const updatedUser = await this.userService.update(user.id, {
      isVerified: true,
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found.');
    }

    return updatedUser;
  }

  /**
   * Authenticate user (set session)
   * Created for decomposition the newVerification method.
   * @param req<express.Request>
   * @param user<User>
   * @private Promise<User>
   */
  private async authenticateUser(req: Request, user: User): Promise<User> {
    return await saveSession(req, user);
  }

  private async generateVerificationToken(email: string) {
    const existingToken = await this.getVerificationTokenByEmail(email);

    if (existingToken) {
      await this.deleteToken(existingToken.id);
    }

    return await this.createVerificationToken(email);
  }

  private async getVerificationToken(token: string): Promise<Token | null> {
    return this.prismaService.token.findFirst({
      where: {
        token,
        type: TokenType.VERIFICATION,
      },
    });
  }

  private async getVerificationTokenByEmail(
    email: string,
  ): Promise<Token | null> {
    return this.prismaService.token.findFirst({
      where: {
        email,
        type: TokenType.VERIFICATION,
      },
    });
  }

  private async createVerificationToken(email: string): Promise<Token | null> {
    return this.prismaService.token.create({
      data: {
        token: uuid(),
        email,
        type: TokenType.VERIFICATION,
        expiresIn: this.expiresIn(),
      },
    });
  }

  private deleteToken(id: string): Promise<Token | null> {
    return this.prismaService.token.delete({ where: { id } });
  }

  private expiresIn() {
    return new Date(Date.now() + 60 * 60 * 1000);
  }
}
