import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmationDto {
  @ApiProperty({ description: 'The email verification token' })
  @IsNotEmpty({ message: "The email verification token shouldn't be empty" })
  @IsString({ message: 'The email verification token should be a string' })
  token!: string;
}
