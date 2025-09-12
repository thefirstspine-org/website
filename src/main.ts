import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import hbs from 'hbs';
import { ValidationPipe } from '@nestjs/common';
import { LogsService } from '@thefirstspine/logs-nest';
import session from 'express-session';
import flash from 'connect-flash';
import locales from './locale/locales';
import cookieParser from 'cookie-parser';
import { ErrorFilter } from './errors.filter';
import { registerHelpers } from './hb.helpers';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new ErrorFilter(new LogsService()));
  // app.use(RequestsLoggerMiddleware.use);
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? '',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
      },
    }),
  );
  app.use(flash());
  app.use(cookieParser());

  locales.load('fr', join(__dirname, 'i18n', 'fr.json'));
  locales.load('en', join(__dirname, 'i18n', 'en.json'));
  locales.setLocale('en');

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  hbs.registerPartials(join(__dirname, '..', 'views/partials'));
  
  registerHelpers(hbs);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
