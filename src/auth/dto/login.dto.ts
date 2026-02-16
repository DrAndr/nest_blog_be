import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { RegisterDto } from './register.dto';

export class LoginDto extends PartialType(RegisterDto) {
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

  @ApiProperty({
    example: '1234567',
    description: 'The two-factor authentication code.',
  })
  @IsString()
  @IsNotEmpty()
  // @Length(7, 7)
  code?: string;
}
