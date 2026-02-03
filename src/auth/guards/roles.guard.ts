import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'prisma/__generated__/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Role restriction guard.
 * Verify the user role with the roles attached to the route
 */
@Injectable()
export class RolesGuard implements CanActivate {
  public constructor(private readonly reflector: Reflector) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler,
      context.getClass,
    ]);

    // unrestricted access by roles
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    if (!roles.includes(request.user.role)) {
      throw new ForbiddenException('Forbidden.');
    }

    return true;
  }
}
