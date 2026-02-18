import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Res,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from '@/auth/presentation/dto/register.dto';
import { LoginDto } from '@/auth/presentation/dto/login.dto';
import type { Request, Response } from 'express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClearSessionCookie } from '@/auth/presentation/interceptors/clear-session-cookie.interceptor';
import { Serialize } from '@/presentation/decorators/serialize.decorator';
import { PublicUserDto } from '@/user/dto/publick-user.dto';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { OauthProviderGuard } from '@/auth/presentation/decorators/oauth-provider.decorator';
import type { TypeProvider } from '@/auth/infrastructure/oauth-provider/utils/types';
import { OAuthProviderService } from '@/auth/infrastructure/oauth-provider/oauth-provider.service';
import { ConfigService } from '@nestjs/config';
import { ConfirmationDto } from '@/auth/infrastructure/email-verification/dto/confirmation.dto';
import { EmailVerificationService } from '@/auth/infrastructure/email-verification/email-verification.service';
import { ResetPasswordDto } from '@/auth/presentation/dto/reset-password.dto';
import { PasswordRecoveryService } from '@/auth/infrastructure/reset-password/password-recovery.service';
import { UpdatePasswordDto } from '@/auth/presentation/dto/update-password.dto';
import { Authorized } from '@/auth/presentation/decorators/authorized.decorator';
import { Authorization } from '@/auth/presentation/decorators/authorization.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly providerService: OAuthProviderService,
    private readonly configService: ConfigService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly passwordRecoveryService: PasswordRecoveryService,
  ) {}

  @ApiOperation({ summary: 'Register user' })
  @ApiResponse({ status: 201, description: 'Registered.' })
  @Recaptcha()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  register(@Req() req: Request, @Body() dto: RegisterDto) {
    return this.authService.register(req, dto);
  }

  @ApiOperation({ summary: 'Authenticate user' })
  @ApiResponse({ status: 200, description: 'Logged in.' })
  @Recaptcha()
  @HttpCode(HttpStatus.OK)
  @Serialize(PublicUserDto)
  @Post('login')
  login(@Req() req: Request, @Body() dto: LoginDto) {
    return this.authService.login(req, dto);
  }

  @ApiOperation({ summary: 'Email confirmation.' })
  @ApiResponse({ status: 200, description: 'Require confirmation token.' })
  @HttpCode(HttpStatus.OK)
  @Serialize(PublicUserDto)
  @Post('email-verification')
  public async newVerification(
    @Req() req: Request,
    @Body() dto: ConfirmationDto,
  ) {
    return await this.emailVerificationService.newVerification(req, dto);
  }

  @ApiOperation({ summary: 'Init the reset password event.' })
  @ApiResponse({
    status: 200,
    description:
      'Init reset password action, and send the reset password link.',
  })
  @Post('reset-password')
  public async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.passwordRecoveryService.resetPassword(dto);
    return {
      message:
        'An email with password recovery information has been sent to you..',
    };
  }

  @ApiOperation({ summary: 'Update user password.' })
  @ApiResponse({
    status: 200,
    description: 'Update user password.',
  })
  @Post('reset-password/:token')
  public async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @Param('token') token: string,
  ) {
    await this.passwordRecoveryService.updatePassword(dto, token);
    return { message: 'Password updated.' };
  }

  @ApiOperation({
    summary: 'Init authenticate user through Oauth oauth-provider',
  })
  @ApiResponse({ status: 200, description: 'Return oauth-provider URL' })
  @HttpCode(HttpStatus.OK)
  @OauthProviderGuard()
  @Get('/oauth/connect/:oauth-provider')
  public async connect(@Param('provider') provider: TypeProvider) {
    const providerInstance = this.providerService.findByService(provider);

    return providerInstance?.getAuthUrl();
  }

  @ApiOperation({
    summary: 'Authenticate user through Oauth oauth-provider on the site',
  })
  @ApiResponse({
    status: 200,
    description:
      'Find or create new user account and redirect to the user profile page',
  })
  @HttpCode(HttpStatus.OK)
  @OauthProviderGuard()
  @Get('/oauth/callback/:oauth-provider')
  public async callback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Query('code') code: string,
    @Param('provider') provider: TypeProvider,
  ) {
    if (!code) {
      throw new BadRequestException('Thea no "code" provided.');
    }

    await this.authService.extractProfileFromCode(req, provider, code);

    return res.redirect(
      `${this.configService.getOrThrow<string>('ALLOWED_ORIGIN')}/dashboard/settings`,
    );
  }

  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out.' })
  @Authorization()
  @UseInterceptors(ClearSessionCookie)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Req() req: Request, @Authorized('id') userId: string) {
    return this.authService.logout(req, userId);
  }
}
