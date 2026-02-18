import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { NotificationService } from './notification.service';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '@/user/user.module';
import { getMailConfig } from '@/libs/config/mail.config';

@Module({
  imports: [
    UserModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getMailConfig,
    }),
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
