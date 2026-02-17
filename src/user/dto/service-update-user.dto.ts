import { PartialType } from '@nestjs/mapped-types';
import { PublicUpdateUserDto } from '@/user/dto/public-update-user.dto';

export class ServiceUpdateUserDto extends PartialType(PublicUpdateUserDto) {
  isVerified?: boolean;
  password?: string;
}
