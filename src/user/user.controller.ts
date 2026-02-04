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
import { Serialize } from 'src/libs/common/decorators/serialize.decorator';
import { PublickUserDto } from './dto/publick-user.dto';
import { UserRole } from 'prisma/__generated__/enums';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Authorization(UserRole.ADMIN) // acept role as params "UserRole.ADMIN"
  @HttpCode(HttpStatus.OK)
  @Serialize(PublickUserDto) // instead of @UseInterceptors(new SerializeInterceptor(UserDto))
  @Get('profile')
  public async getUserProfile(@Authorized('id') userId: string) {
    return this.userService.findById(userId);
  }
}
