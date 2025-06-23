import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import hbs from 'hbs';
import showdown from 'showdown';
import { ValidationPipe } from '@nestjs/common';
import { ErrorFilter, LogsService, RequestsLoggerMiddleware } from '@thefirstspine/logs-nest';
import session from 'express-session';
import flash from 'connect-flash';
import locales from './locale/locales';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new ErrorFilter(new LogsService()));
  app.use(RequestsLoggerMiddleware.use);
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

  locales.load('fr', join(__dirname, 'i18n', 'fr.json'));
  locales.load('en', join(__dirname, 'i18n', 'en.json'));
  locales.setLocale('en');

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  hbs.registerPartials(join(__dirname, '..', 'views/partials'));
  hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
  });
  hbs.registerHelper('ifEquals', function(arg1, arg2, context) {
    return (arg1 == arg2) ? context.fn(this) : context.inverse(this);
  });
  hbs.registerHelper('md', function(context) {
    const converter = new showdown.Converter({simpleLineBreaks: true});
    return converter.makeHtml(context);
  });
  hbs.registerHelper('env', function(arg1, context) {
    return process.env[arg1];
  });
  hbs.registerHelper('__', function(arg1, context) {
    return locales.__(arg1);
  });
  hbs.registerHelper('getLocale', function(context) {
    return locales.getLocale();
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
