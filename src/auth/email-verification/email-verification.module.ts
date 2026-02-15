import { forwardRef, Module } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { AuthModule } from '../auth.module';
import { UserModule } from '../../user/user.module';
import { MailModule } from '../../mail/mail.module';
import { TokenProviderModule } from '../token-provider/token-provider.module';

@Module({
  controllers: [],
  providers: [EmailVerificationService],
  imports: [
    UserModule,
    forwardRef(() => AuthModule),
    MailModule,
    TokenProviderModule,
  ],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}
