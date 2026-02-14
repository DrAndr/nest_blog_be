import { Module } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerificationController } from './email-verification.controller';
import { AuthModule } from '../auth.module';
import { UserModule } from '../../user/user.module';
import { MailModule } from '../../mail/mail.module';

@Module({
  controllers: [EmailVerificationController],
  providers: [EmailVerificationService],
  imports: [UserModule, AuthModule, MailModule],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}
