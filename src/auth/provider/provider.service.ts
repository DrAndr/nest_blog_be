import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ProviderOptionsSymbol } from './utils/constants';
import { type TypeOptions } from './utils/types';

import { BaseOauthService } from './services/base-oauth.service';

@Injectable()
export class ProviderService implements OnModuleInit {
  /**
   * Receives provider configuration from DI container.
   * `options` contains:
   *  - baseUrl: shared callback base URL
   *  - services: instantiated OAuth provider services (Google, Yandex, etc.)
   */
  public constructor(
    @Inject(ProviderOptionsSymbol) private readonly options: TypeOptions,
  ) {}

  /**
   * Lifecycle hook executed once the module is initialized.
   *
   * Here we propagate the shared `baseUrl` to every OAuth provider instance.
   * This acts as a post-construction configuration step.
   */
  public onModuleInit() {
    for (const provider of this.options.services) {
      // set a services base url in to each provider
      provider.baseUrl = this.options.baseUrl;
    }
  }

  /**
   * Finds an OAuth provider instance by its service name.
   *
   * @param service - provider identifier (e.g. "google", "yandex")
   * @returns matching BaseOauthService instance or null if not found
   */
  public findByService(service: string): BaseOauthService | null {
    return this.options.services.find((srv) => srv.name === service) ?? null;
  }
}
