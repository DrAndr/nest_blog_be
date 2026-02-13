import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsString,
  isString,
  MaxLength,
} from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(40)
  to!: string;

  @IsString()
  @MaxLength(255)
  subject!: string;

  @IsString()
  @MaxLength(40)
  template?: string;
}
