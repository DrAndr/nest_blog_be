import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'prisma/__generated__/client';

/**
 * Allow as to get all user publick data, or single field
 */
export const AuthorizedDecorator = createParamDecorator(
  (userField: keyof User, context: ExecutionContext) => {
    const { user } = context.switchToHttp().getRequest();

    return userField ? user[userField] : user;
  },
);
