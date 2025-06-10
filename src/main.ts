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
import { I18n } from 'i18n';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new ErrorFilter(new LogsService()));
  app.use(RequestsLoggerMiddleware.use);
  app.use(
    session({
      secret: '123',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
      },
    }),
  );
  app.use(flash());

  const i18n = new I18n();
  i18n.configure({
    locales: ['en', 'fr'],
    directory: join(__dirname, 'i18n'),
  });
  i18n.setLocale('fr');

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
  hbs.registerHelper('i18n', function(arg1, context) {
    console.log({arg1, res: i18n.__(arg1), locale: i18n.getLocale()});
    return i18n.__(arg1);
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
