import { DynamicModule, Module } from '@nestjs/common';
import { ProviderOptionsSymbol } from './utils/constants';
import { TypeAsyncOptions, TypeOptions } from './utils/types';
import { OAuthProviderService } from './oauth-provider.service';

@Module({})
export class OAuthProviderModule {
  /**
   * Synchronous registration of the module.
   * Accepts ready-to-use oauth-provider configuration.
   */
  public static register(options: TypeOptions): DynamicModule {
    return {
      module: OAuthProviderModule,
      providers: [
        /**
         * Store oauth-provider configuration in DI container
         * using a custom injection token.
         */
        { useValue: options.services, provide: ProviderOptionsSymbol },
        /** Registry service that gives access to providers */
        OAuthProviderService,
      ],
      exports: [OAuthProviderService],
    };
  }

  /**
   * Async registration.
   * Used when configuration depends on:
   *  - environment variables
   *  - external services
   *  - async factories
   */
  public static registerAsync(options: TypeAsyncOptions): DynamicModule {
    return {
      module: OAuthProviderModule,
      imports: options.imports,
      providers: [
        {
          /**
           * Factory that builds TypeOptions at runtime
           * (usually from ConfigService / .env).
           */
          useFactory: options.useFactory,
          provide: ProviderOptionsSymbol,
          inject: options.inject,
        },
        OAuthProviderService,
      ],
      exports: [OAuthProviderService],
    };
  }
}
