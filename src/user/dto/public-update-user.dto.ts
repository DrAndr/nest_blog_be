import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../prisma/__generated__/enums';

export class PublicUpdateUserDto extends PickType(CreateUserDto, [
  'email',
  'name',
  'image',
]) {
  @ApiProperty({ description: 'Is two-factor auth enabled.' })
  @IsOptional()
  @IsBoolean()
  isTwoFactor!: boolean;

  @ApiProperty({ description: 'Is user banned.' })
  @IsOptional()
  @IsBoolean()
  banned!: boolean;

  @ApiProperty({ description: 'User role.' })
  @IsOptional()
  @IsString()
  role!: UserRole;
}
