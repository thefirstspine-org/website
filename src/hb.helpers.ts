import showdown from 'showdown';
import locales from './locale/locales';

export function registerHelpers(hbs: any) {
  hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
  });
  hbs.registerHelper('ifEquals', function(arg1, arg2, context) {
    return (arg1 == arg2) ? context.fn(this) : context.inverse(this);
  });
  hbs.registerHelper('ifRegex', function(arg1, arg2, context) {
    return (new RegExp(arg2, 'i')).test(arg1 as string) ? context.fn(this) : context.inverse(this);
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
  hbs.registerHelper('localeDate', function(arg1, context) {
    const date = new Date(arg1);
    if (locales.getLocale() === 'fr') {
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });
}
