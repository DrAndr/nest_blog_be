import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import initSwagger from './libs/common/utils/initSwagger';
import { createClient } from 'redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  new initSwagger(app);

  const config = app.get(ConfigService);

  /**
   * Redis init
   */
  const redis = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    },
    password: process.env.REDIS_PASSWORD,
  });
  redis.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  await redis.connect();

  app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')));

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.use(
    session({
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      name: config.getOrThrow<string>('SESSION_NAME'),
      resave: true,
      saveUninitialized: false, // saveUninitialized: true,
      cookie: {
        domain: config.getOrThrow<string>('SESSION_DOMAIN'),
        maxAge: +config.getOrThrow<number>('SESSION_MAX_AGE'),
        httpOnly: config.getOrThrow<string>('SESSION_HTTP_ONLY') === 'true', // bottleneck
        secure: config.getOrThrow<string>('SESSION_SECURE') === 'true', // bottleneck
        sameSite: 'lax',
      },
      store: new RedisStore({
        client: redis,
        prefix: config.getOrThrow<string>('SESSION_FOLDER'),
      }),
    }),
  );

  // to prevent output private data
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.enableCors({
    origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
    credentials: true,
    exposedHeaders: ['set-cookie'],
  });

  await app.listen(process.env.APP_PORT ?? 3000);
}

void bootstrap();
