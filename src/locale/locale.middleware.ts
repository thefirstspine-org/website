import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request } from 'express';
import locales from './locales';

@Injectable()
export class LocaleMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // Set language stored in session
    if (req.session.language != undefined) {
      locales.setLocale(req.session.language);
      next();
      return;
    }

    // Set language based on request
    const languages = req.acceptsLanguages();
    if (languages.length >= 1) {
      if (languages[0].match(/^fr/)) {
        locales.setLocale('fr');
        next();
        return;
      }
      if (languages[0].match(/^en/)) {
        locales.setLocale('en');
        next();
        return;
      }
    }

    // Set base language
    locales.setLocale('en');
    next();
  }
}
