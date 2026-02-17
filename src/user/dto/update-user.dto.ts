import { PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/__generated__/enums';

export class UpdateUserDto extends PickType(CreateUserDto, ['name', 'image']) {
  @ApiProperty({ example: 'user@email.com', description: 'User email.' })
  @IsEmail({}, { message: 'Invalid email address.' })
  email?: string;

  @ApiProperty({ description: 'Is two-factor auth enabled.' })
  @IsOptional()
  @IsBoolean()
  isTwoFactor?: boolean;

  @ApiProperty({ description: 'Is user banned.' })
  @IsOptional()
  @IsBoolean()
  banned?: boolean;

  @ApiProperty({ description: 'User role.' })
  @IsOptional()
  @IsString()
  role?: UserRole;
}
