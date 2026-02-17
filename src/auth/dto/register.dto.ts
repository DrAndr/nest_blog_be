import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';

import { IsPasswordsMatching } from '@/common/decorators/is-password-matching.decorator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'John',
    description: 'User name.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(25)
  name!: string;

  @ApiProperty({
    example: 'email@email.com',
    description: 'User email address.',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(40)
  email!: string;

  @ApiProperty({ example: '123qweQWE#', description: 'User password.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(40)
  password!: string;

  @ApiProperty({ example: '123qweQWE#', description: 'User repeat password.' })
  @Validate(IsPasswordsMatching, {
    message: 'Wrong confirmation password.',
  })
  passwordRepeat!: string;

  @ApiProperty({ example: '/source/avatar.png', description: 'User image.' })
  @IsOptional()
  @IsString()
  image?: string;
}
