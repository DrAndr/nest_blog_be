import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole } from '@db/__generated__/enums';
import { Roles } from './roles.decorator';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';

/**
 * Invoke mandatory decorators and guards in
 * a single decorator to simplify the use of
 * mandatory guards and decorators.
 * @param roles
 * @returns
 */
export function Authorization(...roles: UserRole[]) {
  if (roles.length > 0) {
    return applyDecorators(Roles(...roles), UseGuards(AuthGuard, RolesGuard));
  }

  return applyDecorators(UseGuards(AuthGuard));
}
