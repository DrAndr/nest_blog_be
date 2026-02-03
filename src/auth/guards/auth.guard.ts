import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserService } from 'src/user/user.service';

/**
 * Auth restriction guard.
 * Сheck the userId and if the user exists,
 * write their public data to the session.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  public constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.session?.userId;

    if (typeof userId === undefined) {
      throw new UnauthorizedException('Unauthorized.');
    }

    const user = this.userService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Unauthorized, user not found.');
    }

    request.user = user;

    return true;
  }
}
