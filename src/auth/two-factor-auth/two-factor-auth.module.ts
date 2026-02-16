import { Module } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { NotificationModule } from '../../notification/notification.module';
import { TokenProviderModule } from '../token-provider/token-provider.module';

@Module({
  controllers: [],
  providers: [TwoFactorAuthService],
  imports: [NotificationModule, TokenProviderModule],
})
export class TwoFactorAuthModule {}
