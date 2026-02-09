import { applyDecorators, UseGuards } from '@nestjs/common';
import { OauthProviderGuard as OauthProvider } from '../guards/provider.guard';

export function OauthProviderGuard() {
  return applyDecorators(UseGuards(OauthProvider));
}
