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
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClearSessionCookie } from './interceptors/clear-session-cookie.interceptor';
import { Serialize } from 'src/libs/common/decorators/serialize.decorator';
import { PublickUserDto } from 'src/user/dto/publick-user.dto';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { OauthProviderGuard } from './decorators/oauth-provider.decorator';
import type { TypeProvider } from './provider/utils/types';
import { ProviderService } from './provider/provider.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly providerService: ProviderService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Register user' })
  @ApiResponse({ status: 201, description: 'Registred.' })
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
  @Serialize(PublickUserDto)
  @Post('login')
  login(@Req() req: Request, @Body() dto: LoginDto) {
    return this.authService.login(req, dto);
  }

  @ApiOperation({ summary: 'Init authenticate user throught Oauth provider' })
  @ApiResponse({ status: 200, description: 'Return provider URL' })
  @HttpCode(HttpStatus.OK)
  @OauthProviderGuard()
  @Get('/oauth/connect/:provider')
  public async connect(@Param('provider') provider: TypeProvider) {
    const providerInstance = this.providerService.findByService(provider);

    return providerInstance?.getAuthUrl();
  }

  @ApiOperation({
    summary: 'Authenticate user throught Oauth provider on the site',
  })
  @ApiResponse({
    status: 200,
    description:
      'Find or create new user account and rediret to the user profile page',
  })
  @HttpCode(HttpStatus.OK)
  @OauthProviderGuard()
  @Get('/oauth/callback/:provider')
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
  @UseInterceptors(ClearSessionCookie)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Req() req: Request) {
    return this.authService.logout(req);
  }
}
