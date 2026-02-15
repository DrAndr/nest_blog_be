import { forwardRef, Module } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { AuthModule } from '../auth.module';
import { UserModule } from '../../user/user.module';
import { MailModule } from '../../mail/mail.module';

@Module({
  controllers: [],
  providers: [EmailVerificationService],
  imports: [UserModule, forwardRef(() => AuthModule), MailModule],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}
