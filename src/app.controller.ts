import { Controller, Get, Render, Req } from '@nestjs/common';
import { StrapiService } from './strapi/strapi.service';

@Controller()
export class AppController {
  constructor(private readonly strapiService: StrapiService) {}

  /**
   * Homepage route
   * @param req Request object
   * @returns Rendered homepage
   */
  @Get('/')
  @Render('global')
  async homepage(@Req() req: Request) {
    const pageData = await this.strapiService.getPageData(null);
    const templateData = await this.strapiService.getGlobalData();
    console.log({ pageData, templateData });
    return {
      page: 'pages/global',
      pageData,
      templateData,
    };
  }

  /**
   * Catch-all route for all other pages
   * @param req Request object
   * @returns Rendered page based on the URL
   */
  @Get('*')
  @Render('global')
  async root(@Req() req: Request) {
    const pageData = await this.strapiService.getPageData(req.url.replace(/^\//, ''));
    const templateData = await this.strapiService.getGlobalData();
    if (!pageData) {
      return { page: 'pages/404', templateData };
    }
    return {
      page: 'pages/global',
      pageData,
      templateData,
    };
  }
}
