import { Module } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { NotificationModule } from '@/infrastructure/notification/notification.module';
import { TokenProviderModule } from '../token-provider/token-provider.module';

@Module({
  controllers: [],
  providers: [TwoFactorAuthService],
  imports: [NotificationModule, TokenProviderModule],
  exports: [TwoFactorAuthService],
})
export class TwoFactorAuthModule {}
