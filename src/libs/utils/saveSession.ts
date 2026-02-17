import { InternalServerErrorException } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/__generated__/client';

/**
 * Write and save session.
 * @param req
 * @param user
 * @returns
 */
export async function saveSession(req: Request, user: User): Promise<User> {
  return new Promise((resolve, reject) => {
    req.session.userId = user.id;

    req.session.save((err) => {
      if (err) {
        return reject(new InternalServerErrorException('Cant`t save session.'));
      }

      //TODO To implement session mapping

      resolve(user);
    });
  });
}
