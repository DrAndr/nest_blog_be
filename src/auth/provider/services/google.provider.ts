import { BaseOauthService } from './base-oauth.service';
import { IGooglePfile } from './interfaces/google-profile.interface';
import { TypeProviderOptions } from './types/provider-options.types';
import { TypeUserInfo } from './types/user-info.type';

export class GoogleProvider extends BaseOauthService {
  public constructor(options: TypeProviderOptions) {
    super({
      name: 'google',
      authorize_url: 'https://accounts.google.com/o/oauth2/v2/auth',
      access_url: 'https://oauth2.googleapis.com/token',
      profile_url: 'https://www.googleapis.com/oauth2/v3/userinfo',
      scopes: options.scopes,
      client_id: options.client_id,
      client_secret: options.client_secret,
    });
  }

  public extractUserInfo(data: IGooglePfile): Promise<TypeUserInfo> {
    const { email, name, picture } = data;
    return super.extractUserInfo({
      email,
      name,
      picture,
    });
  }
}
