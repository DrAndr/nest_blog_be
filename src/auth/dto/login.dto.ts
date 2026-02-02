import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { RegisterDto } from './register.dto';

export class LoginDto extends PartialType(RegisterDto) {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(40)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(40)
  password!: string;
}
