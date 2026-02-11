import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { SendEmailDto } from './dto/send-email.dto';
import { Authorized } from 'src/auth/decorators/authorized.decorator';
import { Authorization } from 'src/auth/decorators/authorization.decorator';

@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @HttpCode(HttpStatus.OK)
  // @Authorization()
  @Post('send')
  async sendWelcomeEmail(@Body() dto: SendEmailDto) {
    // console.log('userNmae', context);
    return this.mailerService.sendWelcomeEmail(dto);
  }
}
