import { BaseOauthService } from './base-oauth.service';
import { IYandexProfile } from './interfaces/yandex-profile.interface';
import { TypeProviderOptions } from './types/provider-options.types';
import { TypeUserInfo } from './types/user-info.type';

export class YandexProvider extends BaseOauthService {
  public constructor(options: TypeProviderOptions) {
    super({
      name: 'yandex',
      authorize_url: 'https://oauth.yandex.ru/authorize',
      access_url: 'https://oauth.yandex.ru/token',
      profile_url: 'https://login.yandex.ru/info?format=json',
      scopes: options.scopes,
      client_id: options.client_id,
      client_secret: options.client_secret,
    });
  }

  public extractUserInfo(data: IYandexProfile): Promise<TypeUserInfo> {
    return super.extractUserInfo({
      email: data.emails?.at(0),
      name: data.display_name,
      picture: data.default_avatar_id
        ? `https://avatars.yandex.net/get-yapic/${data.default_avatar_id}/islands-200`
        : undefined,
    });
  }
}
