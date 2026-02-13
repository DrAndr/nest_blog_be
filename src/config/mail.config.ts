import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const getMailConfig = (config: ConfigService) => ({
  transport: {
    host: config.getOrThrow<string>('MAIL_HOST'),
    port: config.getOrThrow<number>('MAIL_PORT'),
    auth: {
      user: config.getOrThrow<string>('MAIL_LOGIN'),
      pass: config.getOrThrow<string>('MAIL_PASSWORD'),
    },
  },
  defaults: {
    from: config.getOrThrow<string>('MAIL_FROM'),
  },
  template: {
    dir: join(__dirname, '../mail/templates'),
    adapter: new HandlebarsAdapter({
      /** register helper for templates */
      default: (value: any, defaultValue: any) => value ?? defaultValue,
    }),
    options: { strict: true },
  },
});
