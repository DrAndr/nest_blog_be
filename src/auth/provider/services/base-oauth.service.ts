import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { TypeBaseProviderOptions } from './types/base-provider-options.types';
import { TypeUserInfo } from './types/user-info.type';
import { TypeTkenData } from './types/token-response.type';

/**
 * Base abstarct class for the Oauth providers factory
 */
@Injectable()
export class BaseOauthService {
  BASE_URL!: string;
  public constructor(private readonly options: TypeBaseProviderOptions) {}

  protected async extractUserInfo(data: any): Promise<TypeUserInfo> {
    return { ...data, provider: this.options.name };
  }

  public getAuthUrl() {
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: this.options.client_id,
      redirect_uri: this.getRedirectUrl(),
      scope: (this.options.scopes ?? []).join(' '),
      access_type: 'offline',
      prompt: 'select_account',
    });

    return `${this.options.authorize_url}?${query}`;
  }

  public async findUserByCode(code: string): Promise<TypeUserInfo> {
    const { client_id, client_secret } = this.options;
    const tokenQuery = new URLSearchParams({
      client_id,
      client_secret,
      redirect_uri: this.getRedirectUrl(),
      grant_type: 'authorization_code',
      code,
    });

    const tokenRsponse = await fetch(this.options.access_url, {
      method: 'POST',
      body: tokenQuery,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
    });

    if (!tokenRsponse.ok) {
      throw new BadRequestException(
        'User retriving failure, check the access_token: ' +
          this.options.profile_url,
      );
    }

    const data = (await tokenRsponse.json()) as TypeTkenData;

    if (!data.access_token) {
      throw new BadRequestException(
        `There no tokens received from ${this.options.profile_url}, doublechek the auth code.`,
      );
    }

    const userData = await this.getUserData(data);

    return {
      ...userData,
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? '',
      expires_at: data?.expires_at || data?.expires_in,
      provider: this.options.name,
    };
  }

  public getRedirectUrl() {
    return `${this.BASE_URL}/auth/oauth/callback/${this.options.name}`;
  }

  private async getUserData(data: TypeTkenData): Promise<TypeUserInfo> {
    const userRequest = await fetch(this.options.profile_url, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });

    if (!userRequest.ok) {
      throw new UnauthorizedException(
        `There no user received from ${this.options.profile_url}, doublechek the access token.`,
      );
    }

    const user = await userRequest.json();
    return await this.extractUserInfo(user);
  }

  /** */

  set baseUrl(value: string) {
    this.BASE_URL = value;
  }
  get name() {
    return this.options.name;
  }

  get accessUrl() {
    return this.options.access_url;
  }

  get profileUrl() {
    return this.options.profile_url;
  }

  get scopes() {
    return this.options.scopes;
  }
}
