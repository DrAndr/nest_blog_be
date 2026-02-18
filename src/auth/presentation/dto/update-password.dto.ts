import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({ example: '123qweQWE#', description: 'New password.' })
  @IsString({ message: 'the password should be a string.' })
  @IsNotEmpty()
  @MinLength(2, { message: 'password min 2 symbols' })
  @MaxLength(25, { message: 'password max 25 symbols' })
  password!: string;
}
