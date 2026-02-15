import { forwardRef, Module } from '@nestjs/common';
import { PasswordRecoveryService } from './password-recovery.service';
import { UserModule } from '../../user/user.module';
import { AuthModule } from '../auth.module';
import { TokenProviderService } from '../token-provider/token-provider.service';
import { TokenProviderModule } from '../token-provider/token-provider.module';
import { MailModule } from '../../mail/mail.module';

@Module({
  controllers: [],
  providers: [PasswordRecoveryService],
  imports: [
    UserModule,
    MailModule,
    // forwardRef(() => AuthModule),
    TokenProviderModule,
  ],
  exports: [PasswordRecoveryService],
})
export class PasswordRecoveryModule {}
