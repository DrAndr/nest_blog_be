import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserService } from 'src/user/user.service';
import type { Request, Response } from 'express';
import argon2 from 'argon2';
import { plainToInstance } from 'class-transformer';
import { PublicUserDto } from 'src/user/dto/publick-user.dto';
import { AuthUserFactory } from './utils/auth-user.factory';
import { ConfigService } from '@nestjs/config';
import { ProviderService } from './provider/provider.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthMethod } from 'prisma/__generated__/enums';
import { TypeUserInfo } from './provider/services/types/user-info.type';
import type { User } from 'prisma/__generated__/client';
import { MailService } from '../mail/mail.service';
import { EmailVerificationService } from './email-verification/email-verification.service';

import { saveSession } from './utils/saveSession';
import destroySession from './utils/destroySession';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly providerService: ProviderService,
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  public async register(req: Request, registerDto: RegisterDto) {
    const user = await this.userService.findByEmail(registerDto.email);

    if (user) {
      throw new ConflictException('Registration failed, Email already taken.');
    }

    const userData = await AuthUserFactory.createWithCredentials(registerDto);
    const newUser = await this.userService.create(userData);

    // const token = await this.emailVerificationService.newVerificationToken(
    //   req,
    //   registerDto.email,
    // );

    // sendVerificationToken;
    // Use HERE mail before give an access, for verification email firstly
    this.mailService.onRegisterVerification({ to: '', subject: '', url: '' });

    return saveSession(req, newUser);
  }

  public async login(req: Request, dto: LoginDto) {
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

    // add validation isVerified, before give an access

    return saveSession(req, user);
  }

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
          accessToken: profile.access_token,
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
   * Search and return an user profile by Oauth provider code
   * @param provider
   * @param code
   * @returns
   */
  private async getOAuthProfile(provider: string, code: string) {
    /**
     * Get OAuth provider instance from registry.
     */
    const providerInstance = this.providerService.findByService(provider);

    if (!providerInstance) {
      throw new BadRequestException('Wrong provider value' + provider);
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
