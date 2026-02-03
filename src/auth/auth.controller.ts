import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClearSessionCookie } from './interceptors/clear-session-cookie.interceptor';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register user' })
  @ApiResponse({ status: 201, description: 'Registred.' })
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  register(@Req() req: Request, @Body() dto: RegisterDto) {
    return this.authService.register(req, dto);
  }

  @ApiOperation({ summary: 'Authenticate user' })
  @ApiResponse({ status: 200, description: 'Logged in.' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Req() req: Request, @Body() dto: LoginDto) {
    return this.authService.login(req, dto);
  }
  @UseInterceptors(ClearSessionCookie)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out.' })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Req() req: Request) {
    return this.authService.logout(req);
  }
}
