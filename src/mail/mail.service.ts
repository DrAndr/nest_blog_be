import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendMailDto } from './dto/send-mail.dto';
import { ISendConfirmationEmail } from './common/interfaces/send-confirmation-email.interface';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/components';
import { EmailConfirmationTemplate } from './templates/email-confirmation.template';
import { CONFIRMATION_EMAIL_URI } from '../common/constants';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class MailService {
  public constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

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
    const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN');
    const html = await render(
      EmailConfirmationTemplate({
        domain,
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
