import { ConfigService } from '@nestjs/config';
import { GoogleProvider } from 'src/auth/provider/services/google.provider';
import { YandexProvider } from 'src/auth/provider/services/yandex.provide';
import { TypeOptions } from 'src/auth/provider/utils/types';

/**
 * Runtime factory that builds OAuth provider configuration
 * using values from ConfigService (.env).
 */
export const getProvidersConfig = async (
  configService: ConfigService,
): Promise<TypeOptions> => ({
  baseUrl:
    /**
     * Base application URL used for OAuth callbacks
     * */
    configService.getOrThrow<string>('APP_URL'),

  /**
   * Instantiated OAuth provider services
   * */
  services: [
    new GoogleProvider({
      client_id: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      client_secret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      scopes: ['email', 'profile'],
    }),
    new YandexProvider({
      client_id: configService.getOrThrow<string>('YANDEX_CLIENT_ID'),
      client_secret: configService.getOrThrow<string>('YANDEX_CLIENT_SECRET'),
      scopes: ['login:email', 'login:avatar', 'login:info'],
    }),
  ],
});
