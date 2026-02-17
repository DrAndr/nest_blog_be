import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { NotificationService } from '@/infrastructure/notification/notification.service';
import { TokenType } from '@prisma/__generated__/enums';
import { TokenProviderService } from '../token-provider/token-provider.service';
import { IServiceResponse } from '@/libs/interfaces';

@Injectable()
export class TwoFactorAuthService {
  public constructor(
    private readonly tokenProviderService: TokenProviderService,
    private readonly notificationService: NotificationService,
  ) {}

  public async sendToken(email: string): Promise<IServiceResponse> {
    const tokenData = await this.tokenProviderService.generateToken(
      email,
      TokenType.TWO_FACTOR,
    );

    if (!tokenData) {
      throw new InternalServerErrorException(
        'Token was`nt created, in unexpected reason.',
      );
    }

    await this.notificationService.sendTwoFactorTokenEmail({
      email,
      token: tokenData.token,
    });

    return { message: 'Two-factor`s auth code sent.' };
  }

  public async validateToken(email: string, token: string): Promise<boolean> {
    const foundToken = await this.tokenProviderService.getToken(
      token,
      TokenType.TWO_FACTOR,
      email,
    );

    if (!foundToken) {
      throw new NotFoundException('Token not found.');
    }

    if (foundToken.token !== token) {
      throw new BadRequestException('Wrong code.');
    }

    const isExpired = new Date(foundToken.expiresIn) < new Date();
    if (isExpired) {
      throw new UnauthorizedException('Token has been expired.');
    }

    await this.tokenProviderService.deleteToken(foundToken.id);

    return true;
  }
}
