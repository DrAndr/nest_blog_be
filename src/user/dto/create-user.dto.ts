import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { AuthMethod } from '@prisma/__generated__/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'user@email.com', description: 'User email.' })
  @IsEmail({}, { message: 'Invalid email address.' })
  email!: string;

  @ApiProperty({ example: 'John', description: 'User name.' })
  @IsString({ message: 'Should be a string.' })
  @IsNotEmpty({ message: 'Name is required.' })
  @MinLength(2, { message: 'Min 2 symbols' })
  @MaxLength(25, { message: 'Max 25 symbols' })
  name!: string;

  @ApiProperty({ description: 'User image.' })
  @IsOptional()
  @IsString()
  image!: string;

  @ApiProperty({ example: 'qwerty123U', description: 'User password.' })
  @IsString({ message: 'Should be a string.' })
  @MinLength(8, { message: 'Min 8 symbols' })
  @MaxLength(40, { message: 'Max 40 symbols' })
  password!: string;

  @ApiProperty({
    example: 'CREDENTIALS',
    description: 'User registration method.',
  })
  @IsString({ message: 'Should be a string.' })
  @IsNotEmpty({ message: 'Method is required.' })
  method!: AuthMethod;

  @ApiProperty({
    example: 'false',
    description: 'User verification status.',
  })
  @IsBoolean()
  isVerified?: boolean;
}
