import { InternalServerErrorException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Attempt to destroy session.
 * @param req
 * @returns boolean
 */
export default async function destroySession(req: Request): Promise<boolean> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        return reject(
          new InternalServerErrorException('Cant`t destroy session.'),
        );
      }

      resolve(true);
    });
  });
}
