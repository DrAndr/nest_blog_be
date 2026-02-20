import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { PrismaModule } from '@/infrastructure/prisma-provider/prisma.module';
import { UserModule } from '@/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { IS_DEV_ENV } from '@/libs/utils/is-dev.util';
import { AuthModule } from '@/auth/auth.module';
import { OAuthProviderModule } from '@/auth/infrastructure/oauth-provider/oauth-provider.module';
import { NotificationModule } from '@/infrastructure/notification/notification.module';
import { EmailVerificationModule } from '@/auth/infrastructure/email-verification/email-verification.module';
import { PasswordRecoveryModule } from '@/auth/infrastructure/reset-password/password-recovery.module';
import { TokenProviderModule } from '@/auth/infrastructure/token-provider/token-provider.module';
import { TwoFactorAuthModule } from '@/auth/infrastructure/two-factor-auth/two-factor-auth.module';
import { RedisProviderModule } from '@/infrastructure/redis-provider/redis-provider.module';
import { SessionProviderModule } from '@/infrastructure/session-provider/session-provider.module';
import { HealthCheckModule } from '@/health-check/health-check.module';
import { UploadFilesModule } from './upload-files/upload-files.module';

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
    RedisProviderModule,
    SessionProviderModule,
    HealthCheckModule,
    UploadFilesModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
