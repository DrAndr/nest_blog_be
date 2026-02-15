import { Module } from '@nestjs/common';
import { TokenProviderService } from './token-provider.service';

@Module({
  controllers: [],
  providers: [TokenProviderService],
  exports: [TokenProviderService],
})
export class TokenProviderModule {}
