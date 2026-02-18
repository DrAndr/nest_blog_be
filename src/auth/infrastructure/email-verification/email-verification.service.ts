import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { TokenType } from '@db/__generated__/enums';
import type { Token, User } from '@db/__generated__/client';
import { ConfirmationDto } from './dto/confirmation.dto';
import type { Request } from 'express';
import { UserService } from '@/user/user.service';
import { NotificationService } from '@/infrastructure/notification/notification.service';
import { TokenProviderService } from '../token-provider/token-provider.service';
import { SessionProviderService } from '@/infrastructure/session-provider/session-provider.service';

@Injectable()
export class EmailVerificationService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly NotificationService: NotificationService,
    private readonly tokenService: TokenProviderService,
    private readonly sessionProviderService: SessionProviderService,
  ) {}

  /**
   * Generate and write token in to DB, then bind email sending with verification link
   * @param email string
   */
  public async sendVerificationToken(email: string): Promise<boolean> {
    const tokenData = await this.tokenService.generateToken(
      email,
      TokenType.VERIFICATION,
    );
    const sentMessageInfo =
      await this.NotificationService.sendConfirmationEmail({
        email: email,
        token: tokenData.token,
      });

    if (!sentMessageInfo?.accepted?.length) {
      throw new ServiceUnavailableException(
        'Failed to send verification email.',
      );
    }

    return true;
  }

  /**
   * Generate token
   * @param req
   * @param token
   */
  public async newVerification(
    req: Request,
    { token }: ConfirmationDto,
  ): Promise<User> {
    const tokenData = await this.validateToken(token);
    const user = await this.verifyUser(tokenData.email);

    await this.tokenService.deleteToken(tokenData.id); // remove token after all actions

    return this.authenticateUser(req, user);
  }

  /**
   * Check is token exist in DB and return found token entity
   * Created for decomposition the newVerification method.
   * @param token
   * @private Promise<Token>
   */
  private async validateToken(token: string): Promise<Token> {
    const existingToken = await this.tokenService.getToken(
      token,
      TokenType.VERIFICATION,
    );

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
      throw new InternalServerErrorException(
        'Internal server error, user status was`nt updated.',
      );
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
    await this.sessionProviderService.saveSession(req, user);
    return user;
  }
}
