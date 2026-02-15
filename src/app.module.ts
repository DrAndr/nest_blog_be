import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { IS_DEV_ENV } from './libs/common/utils/is-dev.util';
import { AuthModule } from './auth/auth.module';
import { ProviderModule } from './auth/provider/provider.module';
import { MailModule } from './mail/mail.module';
import { EmailVerificationModule } from './auth/email-verification/email-verification.module';
import { PasswordRecoveryModule } from './auth/reset-password/password-recovery.module';
import { TokenProviderModule } from './auth/token-provider/token-provider.module';

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
    ProviderModule,
    MailModule,
    EmailVerificationModule,
    PasswordRecoveryModule,
    TokenProviderModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
