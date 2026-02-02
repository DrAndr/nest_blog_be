import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';

import { IsPasswordsMatching } from 'src/libs/common/decorators/is-password-matching.decorator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(25)
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(40)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(40)
  password!: string;

  @Validate(IsPasswordsMatching, {
    message: 'Wrong confirmation password.',
  })
  passwordRepeat!: string;

  @IsOptional()
  @IsString()
  image?: string;
}
