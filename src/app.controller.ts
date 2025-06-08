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
    return this.getPage(null);
  }

  @Get('/blog')
  @Render('global')
  async blog(@Req() req: Request) {
    const templateData = await this.strapiService.getGlobalData();
    const articles: any[] = await this.strapiService.getArticles();
    const featuredArticle = articles.splice(0, 1)[0];
    return {
      page: 'pages/blog',
      seo: templateData?.defaultSeo,
      templateData,
      pageData: {
        articles,
        featuredArticle,
      },
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
    return this.getPage(req.url.replace(/^\//, ''));
  }

  /**
   * Generate a base
   * @param page The page path
   * @returns Rendered page based on the URL
   */
  async getPage(page: string | null) {
    const templateData = await this.strapiService.getGlobalData();
    const pageData = await this.strapiService.getPageData(page);
    if (!pageData) {
      return { page: 'pages/404', templateData };
    }
    return {
      page: 'pages/global',
      seo: pageData?.seo && pageData?.seo.length >= 1 ? pageData.seo[0] : templateData?.defaultSeo,
      pageData,
      templateData,
    };
  }
}
