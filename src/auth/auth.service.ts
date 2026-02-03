import {
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
import { PublickUserDto } from 'src/user/dto/publick-user.dto';
import { AuthUserFactory } from './utils/auth-user.factory';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  public async register(req: Request, registerDto: RegisterDto) {
    const user = await this.userService.findByEmail(registerDto.email);

    if (user) {
      throw new ConflictException('Registration failed, Email already taken.');
    }

    const userData = await AuthUserFactory.createWithCredentials(registerDto);
    const newUser = await this.userService.create(userData);

    return this.saveSession(req, newUser);
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

    return this.saveSession(req, user);
  }

  public async logout(req: Request, res: Response): Promise<void> {
    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          return reject(
            new InternalServerErrorException('Cant`t destroy session.'),
          );
        }
        res.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'));
        resolve(true);
      });
    });
  }

  private async saveSession(req: Request, user) {
    return new Promise((resolve, reject) => {
      req.session.userId = user.id;

      req.session.save((err) => {
        if (err) {
          return reject(
            new InternalServerErrorException('Cant`t save session.'),
          );
        }

        //TODO To implement session mapping

        resolve(
          plainToInstance(PublickUserDto, user, {
            excludeExtraneousValues: true,
          }),
        );
      });
    });
  }
}
