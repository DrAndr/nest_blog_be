import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Authorization } from 'src/auth/decorators/authorization.decorator';
import { Authorized } from 'src/auth/decorators/authorized.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Authorization() // The "Method" decorator
  @HttpCode(HttpStatus.OK)
  @Get('profile')
  public async getUserProfile(@Authorized('id') userId: string) {
    return this.userService.findById(userId);
  }
}
