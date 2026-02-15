import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { TokenType } from '../../../prisma/__generated__/enums';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { TokenProviderService } from '../token-provider/token-provider.service';
import { MailService } from '../../mail/mail.service';
import argon2 from 'argon2';

@Injectable()
export class PasswordRecoveryService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenProviderService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Send the reset password page link
   * @param email
   */
  public async resetPassword({ email }: ResetPasswordDto): Promise<boolean> {
    // checking user email
    const existingUser = await this.userService.findByEmail(email);

    // hide the mail checking status to prevent brute force
    if (existingUser?.email) {
      // create temporary token for reset password
      const tokenData = await this.tokenService.generateToken(
        email,
        TokenType.PASSWORD_RESET,
      );

      // send mail with link for the password reset
      const sentMessageInfo = await this.mailService.sendResetPasswordEmail({
        email,
        token: tokenData.token,
      });

      if (!sentMessageInfo?.accepted?.length) {
        throw new ServiceUnavailableException('Failed to send email.');
      }
    }
    //
    return true;
  }

  /**
   * Update user password
   * @param nwePassword string
   * @param token string
   */
  public async updatePassword(
    { password }: UpdatePasswordDto,
    token: string,
  ): Promise<void> {
    const tokenData = await this.tokenService.getToken(
      token,
      TokenType.PASSWORD_RESET,
    );

    if (!tokenData || tokenData.expiresIn < new Date()) {
      throw new NotFoundException('Token not found or expired.');
    }

    const user = await this.userService.findByEmail(tokenData.email);

    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const hashedPassword = await argon2.hash(password);
    const updatedUser = await this.userService.update(user.id, {
      password: hashedPassword,
    });

    if (!updatedUser) {
      throw new InternalServerErrorException(
        'Internal server error, user password was`nt updated.',
      );
    }

    await this.tokenService.deleteToken(tokenData.id); // remove token after all actions
  }
}
