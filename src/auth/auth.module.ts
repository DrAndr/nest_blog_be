import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha';
import { getRecaptchaConfig } from '@/libs/config/recaptcha.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OAuthProviderModule } from '@/auth/infrastructure/oauth-provider/oauth-provider.module';
import { getProvidersConfig } from '@/libs/config/providers.config';
import { NotificationModule } from '@/infrastructure/notification/notification.module';
import { EmailVerificationModule } from '@/auth/infrastructure/email-verification/email-verification.module';
import { PasswordRecoveryModule } from '@/auth/infrastructure/reset-password/password-recovery.module';
import { TwoFactorAuthModule } from '@/auth/infrastructure/two-factor-auth/two-factor-auth.module';
import { SessionProviderModule } from '@/infrastructure/session-provider/session-provider.module';

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
    NotificationModule,
    forwardRef(() => EmailVerificationModule),
    PasswordRecoveryModule,
    TwoFactorAuthModule,
    SessionProviderModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
