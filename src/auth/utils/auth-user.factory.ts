import argon2 from 'argon2';
import { RegisterDto } from '../dto/register.dto';
import { AuthMethod } from 'prisma/__generated__/enums';

export class AuthUserFactory {
  static async createWithCredentials(dto: RegisterDto) {
    const hashedPassword = await argon2.hash(dto.password);

    return {
      email: dto.email,
      name: dto.name ?? '',
      image: dto.image ?? '',
      password: hashedPassword,
      method: AuthMethod.CREDENTIALS,
    };
  }
}
