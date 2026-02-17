import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Authorization } from '@/auth/presentation/decorators/authorization.decorator';
import { Authorized } from '@/auth/presentation/decorators/authorized.decorator';
import { Serialize } from '@/presentation/decorators/serialize.decorator';
import { PublicUserDto } from './dto/publick-user.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/__generated__/enums';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/__generated__/client';
import { IServiceResponse } from '@/libs/interfaces';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Return authorised user profile.' })
  @Authorization() // accept role as params "UserRole.ADMIN"
  @HttpCode(HttpStatus.OK)
  @Serialize(PublicUserDto) // instead of @UseInterceptors(new SerializeInterceptor(UserDto))
  @Get('profile')
  public async getUserProfile(@Authorized('id') userId: string) {
    return this.userService.findById(userId);
  }

  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Return updated user profile.' })
  @Authorization(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @Serialize(PublicUserDto)
  @Patch(':id')
  public async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete user profile' })
  @ApiResponse({ status: 200, description: 'Return action status.' })
  @Authorization(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  public async remove(@Param('id') id: string): Promise<IServiceResponse> {
    await this.userService.remove(id);
    return { message: 'User profile deleted successfully.' };
  }
}
