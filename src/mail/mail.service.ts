import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { OnRegisterVerificationDto } from './dto/on-register-verification.dto';

@Injectable()
export class MailService {
  public constructor(private readonly mailerService: MailerService) {}

  async onRegisterVerification(dto: OnRegisterVerificationDto) {
    return await this.mailerService.sendMail({
      to: dto.to,
      subject: dto.subject,
      //   html: `<a href="#">Verify</a>`, // alter approach for decoration data
      template: './on-register-verification',
      context: {
        name: 'name', //get registed user name from session
        email: dto.to,
        url: dto.url,
        year: new Date().getFullYear(),
      },
    });
  }
}
