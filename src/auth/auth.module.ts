import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/user/user.service';
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha';
import { getRecaptchaConfig } from 'src/config/recaptcha.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OAuthProviderModule } from './oauth-provider/oauth-provider.module';
import { getProvidersConfig } from 'src/config/providers.config';
import { NotificationModule } from '../notification/notification.module';
import { NotificationService } from '../notification/notification.service';
import { EmailVerificationService } from './email-verification/email-verification.service';
import { EmailVerificationModule } from './email-verification/email-verification.module';
import { UserModule } from '../user/user.module';
import { PasswordRecoveryModule } from './reset-password/password-recovery.module';
import { TwoFactorAuthModule } from './two-factor-auth/two-factor-auth.module';

@Module({
  imports: [
    OAuthProviderModule.registerAsync({
      imports: [ConfigModule],
      useFactory: getProvidersConfig,
      inject: [ConfigService],
    }),
    GoogleRecaptchaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getRecaptchaConfig,
      inject: [ConfigService],
    }),
    UserModule,
    NotificationModule,
    forwardRef(() => EmailVerificationModule),
    PasswordRecoveryModule,
    TwoFactorAuthModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
