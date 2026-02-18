import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ClearSessionCookie implements NestInterceptor {
  public constructor(private readonly configService: ConfigService) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse();

    return next.handle().pipe(
      tap(() => {
        const cookieName =
          this.configService.getOrThrow<string>('SESSION_NAME');

        res.clearCookie(cookieName, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
        });
      }),
    );
  }
}
