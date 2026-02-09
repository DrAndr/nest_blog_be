import { DynamicModule, Module } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { ProviderOptionsSymbol } from './utils/constants';
import { TypeAsyncOptions, TypeOptions } from './utils/types';

@Module({})
export class ProviderModule {
  /**
   * Synchronous registration of the module.
   * Accepts ready-to-use provider configuration.
   */
  public static register(options: TypeOptions): DynamicModule {
    return {
      module: ProviderModule,
      providers: [
        /**
         * Store provider configuration in DI container
         * using a custom injection token.
         */
        { useValue: options.services, provide: ProviderOptionsSymbol },
        /** Registry service that gives access to providers */
        ProviderService,
      ],
      exports: [ProviderService],
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
      module: ProviderModule,
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
        ProviderService,
      ],
      exports: [ProviderService],
    };
  }
}
