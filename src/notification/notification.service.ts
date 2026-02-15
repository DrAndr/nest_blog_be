import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendMailDto } from './dto/send-mail.dto';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/components';
import { EmailConfirmationTemplate } from './templates/email-confirmation.template';
import { ResetPasswordTemplate } from './templates/reset-password.template';
import { TwoFactorAuthTemplate } from './templates/two-factor-auth.template';
import {
  CONFIRMATION_EMAIL_URI,
  RESET_PASSWORD_EMAIL_URI,
} from '../common/constants';
import { SentMessageInfo } from 'nodemailer';
import { ISendConfirmationEmail } from './common/interfaces/send-confirmation-email.interface';
import { ISendResetPasswordEmail } from './common/interfaces/send-reset-password-email.interface';
import { ISendTwoFactorAuthEmail } from './common/interfaces/send-two-factor-auth-email.interface';

@Injectable()
export class NotificationService {
  private domain!: string;
  public constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN');
  }

  /**
   * Send email with confirmation link for email verification
   * @param email
   * @param token
   * @return Promise<SentMessageInfo>
   */
  public async sendConfirmationEmail({
    email,
    token,
  }: ISendConfirmationEmail): Promise<SentMessageInfo> {
    const html = await render(
      EmailConfirmationTemplate({
        domain: this.domain,
        email,
        token,
        uri: CONFIRMATION_EMAIL_URI,
      }),
    );

    return await this.sendMail({
      to: email,
      subject: 'Email verification.',
      html,
    });
  }

  /**
   * Send the reset password token
   * @param email
   * @param token
   * @return Promise<SentMessageInfo>
   */
  public async sendResetPasswordEmail({
    email,
    token,
  }: ISendResetPasswordEmail): Promise<SentMessageInfo> {
    const html = await render(
      ResetPasswordTemplate({
        domain: this.domain,
        token,
        uri: RESET_PASSWORD_EMAIL_URI,
      }),
    );

    return await this.sendMail({
      to: email,
      subject: 'Reset password confirmation.',
      html,
    });
  }

  /**
   * Send two-auth token
   * @param email
   * @param token
   * @return Promise<SentMessageInfo>
   */
  public async sendTwoFactorTokenEmail({
    email,
    token,
  }: ISendTwoFactorAuthEmail): Promise<SentMessageInfo> {
    const html = await render(
      TwoFactorAuthTemplate({
        domain: this.domain,
        token,
      }),
    );

    return await this.sendMail({
      to: email,
      subject: 'Two Factor Token.',
      html,
    });
  }

  /**
   * Send email
   * @param dto
   * @return Promise<SentMessageInfo>
   */
  public async sendMail(dto: SendMailDto): Promise<SentMessageInfo> {
    return await this.mailerService.sendMail({
      to: dto.to,
      subject: dto.subject,
      html: dto.html,

      // alter approach, instead of "html:" usage
      // template: './on-register-verification', // .hds template
      // context: {
      //   name: 'name', //get register user name from session
      //   email: dto.to,
      //   url: dto.url,
      // },
    });
  }
}
