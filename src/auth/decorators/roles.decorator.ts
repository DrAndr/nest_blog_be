import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'prisma/__generated__/enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => {
  return SetMetadata(ROLES_KEY, roles);
};
