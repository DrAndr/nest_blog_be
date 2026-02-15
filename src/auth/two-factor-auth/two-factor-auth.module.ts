import { Module } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { NotificationModule } from '../../notification/notification.module';

@Module({
  controllers: [],
  providers: [TwoFactorAuthService],
  imports: [NotificationModule],
})
export class TwoFactorAuthModule {}
