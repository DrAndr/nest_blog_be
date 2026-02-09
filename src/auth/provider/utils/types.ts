import { FactoryProvider, ModuleMetadata } from '@nestjs/common';
import { BaseOauthService } from '../services/base-oauth.service';

export type TypeProvider = 'yandex' | 'google';

export type TypeOptions = {
  baseUrl: string;
  services: BaseOauthService[];
};

export type TypeAsyncOptions = Pick<ModuleMetadata, 'imports'> &
  Pick<FactoryProvider<TypeOptions>, 'useFactory' | 'inject'>;
