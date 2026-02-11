import { Injectable } from '@nestjs/common';
import { MailerService as Mailer } from '@nestjs-modules/mailer';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class MailerService {
  public constructor(private readonly mailer: Mailer) {}

  async sendWelcomeEmail(dto: SendEmailDto) {
    console.log('dto', dto);
    return await this.mailer.sendMail({
      to: dto.to,
      subject: dto.subject,
      html: `<a href="#">Verify</a>`,
      //   template: `./${dto.template ?? 'default'}`, //'./welcome', // файл welcome.hbs в папке templates
      //   context: dto.context, //{ name: userName, },
    });
  }
}
