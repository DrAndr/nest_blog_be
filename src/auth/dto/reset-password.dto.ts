import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'email@email.com',
    description: 'User email address.',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(40)
  email!: string;
}
