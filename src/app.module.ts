import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '@/prisma-provider/prisma.service';
import { PrismaModule } from '@/prisma-provider/prisma.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { IS_DEV_ENV } from '@/common/utils/is-dev.util';
import { AuthModule } from './auth/auth.module';
import { OAuthProviderModule } from './auth/oauth-provider/oauth-provider.module';
import { NotificationModule } from './notification/notification.module';
import { EmailVerificationModule } from './auth/email-verification/email-verification.module';
import { PasswordRecoveryModule } from './auth/reset-password/password-recovery.module';
import { TokenProviderModule } from './auth/token-provider/token-provider.module';
import { TwoFactorAuthModule } from './auth/two-factor-auth/two-factor-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: !IS_DEV_ENV,
      expandVariables: true,
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    OAuthProviderModule,
    NotificationModule,
    EmailVerificationModule,
    PasswordRecoveryModule,
    TokenProviderModule,
    TwoFactorAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
