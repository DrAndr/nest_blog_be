import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from '@/auth/presentation/dto/register.dto';
import { LoginDto } from '@/auth/presentation/dto/login.dto';
import { UserService } from 'src/user/user.service';
import type { Request } from 'express';
import argon2 from 'argon2';
import { AuthUserFactory } from './utils/auth-user.factory';
import { OAuthProviderService } from '@/auth/infrastructure/oauth-provider/oauth-provider.service';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { AuthMethod } from '@prisma/__generated__/enums';
import { TypeUserInfo } from '@/auth/infrastructure/oauth-provider/services/types/user-info.type';
import type { User } from '@prisma/__generated__/client';
import { IServiceResponse } from '@/libs/interfaces';
import { saveSession } from '@/libs/utils/saveSession';
import destroySession from '@/libs/utils/destroySession';
import { EmailVerificationService } from '@/auth/infrastructure/email-verification/email-verification.service';
import { TwoFactorAuthService } from '@/auth/infrastructure/two-factor-auth/two-factor-auth.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly providerService: OAuthProviderService,
    private readonly prismaService: PrismaService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  /**
   * Validate email, create new user and send verification email
   * @param req
   * @param registerDto
   */
  public async register(req: Request, registerDto: RegisterDto) {
    const user = await this.userService.findByEmail(registerDto.email);

    if (user) {
      throw new ConflictException('Registration failed, Email already taken.');
    }

    const userData = await AuthUserFactory.createWithCredentials(registerDto);
    const newUser = await this.userService.create(userData);

    return await this.emailVerificationService.sendVerificationToken(
      newUser.email,
    );
  }

  /**
   * Validate credentials and auth via writing session
   * @param req
   * @param dto
   */
  public async login(
    req: Request,
    dto: LoginDto,
  ): Promise<User | IServiceResponse> {
    const user = await this.userService.findByEmail(dto.email);

    if (!user || !user?.password) {
      throw new NotFoundException('Invalid credentials');
    }

    const isPasswordMatched = await argon2.verify(user.password, dto.password);

    if (!isPasswordMatched) {
      throw new NotFoundException('Invalid credentials');
    }

    if (req.session.userId && req.session.userId !== user.id) {
      throw new UnauthorizedException(
        'Logout before logging in with another account',
      );
    }

    if (!user.isVerified) {
      // lok`s like not good idea to send email with new token when user try to login,
      // perhaps would be better to allow user resent token manually... may be in future...
      await this.emailVerificationService.sendVerificationToken(user.email);
      throw new UnauthorizedException(
        'Unverified email. New token has been sent.',
      );
    }

    if (user.isTwoFactorEnabled) {
      if (dto.code) {
        /**
         * validate token and authorize user
         */
        const isCodeValid = await this.twoFactorAuthService.validateToken(
          user.email,
          dto.code,
        );

        if (isCodeValid) {
          return saveSession(req, user);
        }
        /**
         *         The validateToken should cath all expected issues,
         *         but for unexpected casse was added next break-point
         */
        throw new InternalServerErrorException(
          'Provided code was`nt verified.',
        );
      } else {
        /**
         * Send code, if user have no code yet...
         */
        return await this.twoFactorAuthService.sendToken(user.email);
      }
    }

    return saveSession(req, user);
  }

  /**
   * Destroy session when logout rout was bound
   * @param req
   */
  public async logout(req: Request): Promise<boolean> {
    return await destroySession(req);
  }

  /**
   * Exchanges OAuth authorization code for user profile,
   * finds or creates a local user, and saves session.
   */
  public async extractProfileFromCode(
    request: Request,
    provider: string,
    code: string,
  ): Promise<void> {
    const profile = await this.getOAuthProfile(provider, code);

    /**
     * Try to find existing OAuth account in database.
     */
    const account = await this.prismaService.account.findFirst({
      where: {
        id: profile?.id,
        provider: profile?.provider,
      },
    });

    const user = await this.findOrCreateUser(account, profile);

    /**
     * Create new user account if none exists.
     */
    if (!account) {
      await this.prismaService.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: profile.provider,
          accessToken: profile?.access_token,
          refreshToken: profile.refresh_token,
          expiresAt: profile.expires_at ?? 0,
        },
      });
    }

    /**
     * Set user session.
     */
    saveSession(request, user);
  }

  /**
   * Search and return a user profile by Oauth oauth-provider code
   * @param provider
   * @param code
   * @returns
   */
  private async getOAuthProfile(
    provider: string,
    code: string,
  ): Promise<TypeUserInfo> {
    /**
     * Get OAuth oauth-provider instance from registry.
     */
    const providerInstance = this.providerService.findByService(provider);

    if (!providerInstance) {
      throw new BadRequestException('Wrong oauth-provider value' + provider);
    }

    /**
     * Request user profile from external OAuth service.
     */
    const profile = await providerInstance?.findUserByCode(code);

    if (!profile) {
      throw new UnauthorizedException('Failed to fetch OAuth profile');
    }

    return profile;
  }

  /**
   * Fetch or create user when Oauth authorisation was succesed
   * @param account
   * @param profile
   * @returns
   */
  private async findOrCreateUser(
    account,
    profile: TypeUserInfo,
  ): Promise<User> {
    /**
     * Load existing user if account is linked.
     */
    let user = account?.userId
      ? await this.userService.findById(account.userId)
      : null;

    /**
     * Create new user if none exists.
     */
    if (!user) {
      user = await this.userService.create({
        email: profile.email,
        name: profile?.name,
        image: profile?.picture,
        method: AuthMethod[profile?.provider.toUpperCase()],
        isVerified: true,
        password: '',
      });

      if (!user) {
        throw new InternalServerErrorException('User was not created');
      }
    }
    return user;
  }
}
