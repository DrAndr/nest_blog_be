import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenType } from '../../../prisma/__generated__/enums';
import type { Token, User } from '../../../prisma/__generated__/client';
import { ConfirmationDto } from './dto/confirmation.dto';
import type { Request } from 'express';
import { UserService } from '../../user/user.service';
import { saveSession } from '../utils/saveSession';
import { MailService } from '../../mail/mail.service';
import { TokenProviderService } from '../token-provider/token-provider.service';

@Injectable()
export class EmailVerificationService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenProviderService,
  ) {}

  /**
   * Generate and write token in to DB, then bind email sending with verification link
   * @param user
   */
  public async sendVerificationToken(user: User): Promise<boolean> {
    const tokenData = await this.tokenService.generateToken(
      user.email,
      TokenType.VERIFICATION,
    );
    const sentMessageInfo = await this.mailService.sendConfirmationEmail({
      email: user.email,
      token: tokenData.token,
    });

    if (!sentMessageInfo?.accepted?.length) {
      throw new ServiceUnavailableException(
        'Failed to send verification email.',
      );
    }

    return true; // { message: 'Email for verification sent.', status: 'success' };
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
    return await saveSession(req, user);
  }
}
