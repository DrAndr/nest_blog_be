import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class SendMailDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(40)
  to!: string;

  @IsString()
  @MaxLength(255)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  html!: string;
}
