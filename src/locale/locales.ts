import * as fs from 'fs';

export class Locales {

  private translations = {};
  private locale = '';

  public load(locale: string, path: string) {
    const file = fs.readFileSync(path);
    this.translations[locale] = JSON.parse(file.toString());
    if (this.locale == '') {
        this.locale = locale;
    }
  }

  public setLocale(locale: string) {
    this.locale = locale;
  }

  public getLocale(): string {
    return this.locale;
  }

  public __(key: string): string {
    const translation = this.translations?.[this.locale]?.[key];
    return translation ? translation : key;
  }

}

export default new Locales();
