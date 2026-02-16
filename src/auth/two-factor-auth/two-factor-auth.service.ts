import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { TokenType, User } from '../../../prisma/__generated__/client';
import { TokenProviderModule } from '../token-provider/token-provider.module';
import { TokenProviderService } from '../token-provider/token-provider.service';

@Injectable()
export class TwoFactorAuthService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly tokenProviderService: TokenProviderService,
    private readonly notificationService: NotificationService,
  ) {}

  public async validateToken(email: string, token: string): Promise<boolean> {
    const existingToken = await this.tokenProviderService.generateToken(
      email,
      TokenType.TWO_FACTOR,
    );

    if (!existingToken) {
      throw new NotFoundException('Token not found.');
    }

    if (existingToken.token !== token) {
      throw new BadRequestException('Wrong token.');
    }

    const isExpired = new Date(existingToken.expiresIn) < new Date();
    if (isExpired) {
      throw new UnauthorizedException('Token has been expired.');
    }

    await this.tokenProviderService.deleteToken(existingToken.id);

    return true;
  }
}
