import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/__generated__/client';

/**
 * Allow as to get all user public data, or single field
 */
export const Authorized = createParamDecorator(
  (userField: keyof User, context: ExecutionContext) => {
    const { user } = context.switchToHttp().getRequest();

    return userField ? user[userField] : user;
  },
);
