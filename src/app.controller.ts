import { Body, Controller, Get, Param, Post, Query, Render, Req, Res, Session } from '@nestjs/common';
import { GlobalData, PageData, SEO, StrapiService } from './strapi/strapi.service';
import { Response, Request } from 'express';
import { EmailDto } from './dtos/email.dto';
import { validate, ValidationError } from 'class-validator';
import { AccountService } from './account/account.service';

@Controller()
export class AppController {
  constructor(
    private readonly strapiService: StrapiService,
    private readonly accountService: AccountService,
  ) {
  }

  @Get('/lang/:lang')
  async lang(@Req() req: any, @Res() res: Response, @Param('lang') lang: string) {
    req.session.language = lang;
    return res.redirect('/');
  }

  @Get('/blog')
  @Render('global')
  async blog(@Req() req: Request, @Query('category') category: string | undefined) {
    const templateData = await this.strapiService.getGlobalData();
    const articles: any[] = await this.strapiService.getArticles(category);
    const featuredArticle = category ? null : articles[0];
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

  @Get('/blog/:slug')
  @Render('global')
  async article(@Req() req: Request, @Param('slug') slug) {
    const templateData = await this.strapiService.getGlobalData();
    const article: any = await this.strapiService.getArticle(slug);
    return {
      page: 'pages/article',
      seo: templateData?.defaultSeo,
      templateData,
      pageData: article,
    };
  }

  @Post('/email')
  async email(@Req() req: Request, @Res() res: Response, @Body() body: any) {
    // Validate query
    const dto = new EmailDto();
    Object.assign(dto, body);
    const errors = await validate(dto);

    // Validation error
    if (errors.length) {
      const contraints = this.getAllConstraints(errors);
      req.flash(
        'errors',
        JSON.stringify(contraints)
      );
      return res.redirect(req.headers['referer'] ? req.headers['referer'] : '/');
    }

    // Validate email
    const existingEmail = await this.strapiService.getEmail(dto.email, dto.campaign);
    if (existingEmail.length > 0) {
      req.flash(
        'errors',
        JSON.stringify(['the email already exists for this campaign'])
      );
      return res.redirect(req.headers['referer'] ? req.headers['referer'] : '/');
    }

    // Send to STRAPI
    this.strapiService.createEmail(dto.email, dto.campaign);
    req.flash(
      'success',
      'email was added'
    );
    return res.redirect(req.headers['referer'] ? req.headers['referer'] : '/');
  }

  @Get('/login')
  @Render('global')
  async login(@Req() req: Request) {
    const templateData = await this.strapiService.getGlobalData();
    const errorsFlashed = req.flash('errors');
    const successFlashed = req.flash('success');
    return {
      page: 'pages/login',
      seo: templateData?.defaultSeo,
      pageData: {
        errors: errorsFlashed.length ? JSON.parse(errorsFlashed[0]) : undefined,
        success: successFlashed.length ? successFlashed[0] : undefined,
      },
      templateData,
    };
  }

  @Post('/login')
  async loginAttempt(@Req() req: Request, @Body() body: any, @Res() res: Response, @Session() session: Record<string, any>) {
    const result = await this.accountService.login(body.email, body.password);
    if (result.errors) {
      req.flash(
        'errors',
        JSON.stringify(result.errors)
      );
      return res.redirect('/login');
    } else {
      session.access_token = result.access_token;
      session.refresh_token = result.refresh_token;
      return res.redirect('/account');
    }
  }

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

  /**
   * Catch-all route for all other pages
   * @param req Request object
   * @returns Rendered page based on the URL
   */
  @Get('*')
  @Render('global')
  async root(@Req() req: Request) {
    const page = await this.getPage(req.url.replace(/^\//, ''));
    const errorsFlashed = req.flash('errors');
    const successFlashed = req.flash('success');
    if (page.pageData) {
      page.pageData.errors = errorsFlashed.length ? JSON.parse(errorsFlashed[0]) : undefined;
      page.pageData.success = successFlashed.length ? successFlashed[0] : undefined;
    }
    return page;
  }

  /**
   * Generate a base
   * @param page The page path
   * @returns Rendered page based on the URL
   */
  async getPage(page: string | null): Promise<RenderedPage> {
    const templateData = await this.strapiService.getGlobalData();
    const pageData = await this.strapiService.getPageData(page);
    if (!pageData) {
      return { page: 'pages/404', templateData, pageData: undefined, seo: undefined };
    }
    return {
      page: 'pages/global',
      seo: pageData?.seo && pageData?.seo.length >= 1 ? pageData.seo[0] : templateData?.defaultSeo,
      pageData,
      templateData,
    };
  }

  getAllConstraints(errors: ValidationError[]): string[] {
    const constraints: string[] = [];
    for (const error of errors) {
      if (error.constraints) {
        const constraintValues = Object.values(error.constraints);
        constraints.push(...constraintValues);
      }
      if (error.children) {
        const childConstraints = this.getAllConstraints(error.children);
        constraints.push(...childConstraints);
      }
    }
    return constraints;
  }
}

export interface RenderedPage {
  page: string;
  templateData: GlobalData | undefined,
  pageData: (PageData & {errors?: any, success?: any}) | undefined,
  seo: SEO | undefined,
}
