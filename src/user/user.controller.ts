import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { Authorization } from 'src/auth/decorators/authorization.decorator';
import { Authorized } from 'src/auth/decorators/authorized.decorator';
import { Serialize } from 'src/libs/common/decorators/serialize.decorator';
import { PublicUserDto } from './dto/publick-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Authorization() // accept role as params "UserRole.ADMIN"
  @HttpCode(HttpStatus.OK)
  @Serialize(PublicUserDto) // instead of @UseInterceptors(new SerializeInterceptor(UserDto))
  @Get('profile')
  public async getUserProfile(@Authorized('id') userId: string) {
    return this.userService.findById(userId);
  }
}
