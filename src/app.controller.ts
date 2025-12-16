import { Body, Controller, Get, Param, Post, Query, Render, Req, Res } from '@nestjs/common';
import { GlobalData, PageData, SEO, StrapiService } from './strapi/strapi.service';
import { Response, Request } from 'express';
import { EmailDto } from './dtos/email.dto';
import { validate, ValidationError } from 'class-validator';
import { AccountService } from './account/account.service';
import { ArenaService } from './arena/arena.service';

@Controller()
export class AppController {

  static readonly notAllowedDomainForEmails = [
    'testform.xyz',
    'example.com',
    'example.org',
    'example.net',
  ];

  constructor(
    private readonly strapiService: StrapiService,
    private readonly accountService: AccountService,
    private readonly arenaService: ArenaService,
  ) {
  }

  @Get('/lang/:lang')
  async lang(@Req() req: any, @Res({passthrough: true}) res: Response, @Param('lang') lang: string) {
    res.cookie('language', lang);
    return res.redirect('/');
  }

  @Get('/user-info')
  async userInfo(@Req() req: any) {
    return {
      isLoggedIn: !!req.user,
      user: req.user || null,
    };
  }

  @Get('robots.txt')
  async robots() {
    if (process.env.ENV === 'dev') {
      return `User-agent: *
Disallow: /`;
    } else {
      return `User-agent: *
Allow: /`;
    }
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

  @Get('/events')
  @Render('global')
  async events(@Req() req: Request, @Query('category') category: string | undefined) {
    const templateData = await this.strapiService.getGlobalData();
    const events: any[] = await this.strapiService.getEvents(category);
    return {
      page: 'pages/events',
      seo: templateData?.defaultSeo,
      templateData,
      pageData: {
        events,
      },
    };
  }

  @Get('/events/:slug')
  @Render('global')
  async event(@Req() req: Request, @Param('slug') slug) {
    const templateData = await this.strapiService.getGlobalData();
    const event: any = await this.strapiService.getEvent(slug);
    if (!event) {
      return {
        page: 'pages/404',
        templateData,
        pageData: undefined,
        seo: undefined,
      };
    }
    return {
      page: 'pages/event',
      seo: templateData?.defaultSeo,
      templateData,
      pageData: event,
    };
  }

  @Get('/blog/:slug')
  @Render('global')
  async article(@Req() req: Request, @Param('slug') slug) {
    const templateData = await this.strapiService.getGlobalData();
    const article: any = await this.strapiService.getArticle(slug);
    if (!article) {
      return {
        page: 'pages/404',
        templateData,
        pageData: undefined,
        seo: undefined,
      };
    }
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

    // Forbid domain email for
    if (AppController.notAllowedDomainForEmails.some(domain => dto.email.endsWith('@' + domain))) {
      req.flash(
        'errors',
        JSON.stringify(['the email is not allowed'])
      );
      return res.redirect(req.headers['referer'] ? req.headers['referer'] : '/');
    }

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
  async login(@Req() req: Request, @Query('redirect') redirect: string | undefined) {
    const templateData = await this.strapiService.getGlobalData();
    const errorsFlashed = req.flash('errors');
    const successFlashed = req.flash('success');
    return {
      page: 'pages/login',
      seo: templateData?.defaultSeo,
      pageData: {
        errors: errorsFlashed.length ? JSON.parse(errorsFlashed[0]) : undefined,
        success: successFlashed.length ? successFlashed[0] : undefined,
        redirect,
      },
      templateData,
    };
  }

  @Post('/login')
  async loginAttempt(@Req() req: Request, @Body() body: any, @Res({passthrough: true}) res: Response, @Query('redirect') redirect: string | undefined) {
    const result = await this.accountService.login(body.email, body.password);
    if (result.errors) {
      req.flash(
        'errors',
        JSON.stringify(result.errors)
      );
      return res.redirect('/login?redirect=' + redirect);
    } else {
      res.cookie('access_token', result.access_token);
      res.cookie('refresh_token', result.refresh_token);
      if (redirect) {
        return res.redirect('/' + redirect);
      }
      return res.redirect('/account');
    }
  }

  @Get('/register')
  @Render('global')
  async register(@Req() req: Request, @Query('redirect') redirect: string | undefined) {
    const templateData = await this.strapiService.getGlobalData();
    const errorsFlashed = req.flash('errors');
    const successFlashed = req.flash('success');
    return {
      page: 'pages/register',
      seo: templateData?.defaultSeo,
      pageData: {
        errors: errorsFlashed.length ? JSON.parse(errorsFlashed[0]) : undefined,
        success: successFlashed.length ? successFlashed[0] : undefined,
        redirect,
      },
      templateData,
    };
  }

  @Post('/register')
  async registerAttempt(@Req() req: Request, @Body() body: any, @Res({passthrough: true}) res: Response, @Query('redirect') redirect: string | undefined) {
    if (body.password != body.password_confirm) {
      req.flash(
        'errors',
        JSON.stringify(['the passwords are not matching'])
      );
      return res.redirect('/register?redirect=' + redirect);
    }
    const result = await this.accountService.signup(body.email, body.password);
    if (result.errors) {
      req.flash(
        'errors',
        JSON.stringify(result.errors)
      );
      return res.redirect('/login?redirect=' + redirect);
    } else {
      // Forward request to login
      return this.loginAttempt(req, body, res, redirect);
    }
  }

  @Get('/lost-password')
  @Render('global')
  async lostPassword(@Req() req: Request, @Query('redirect') redirect: string | undefined) {
    const templateData = await this.strapiService.getGlobalData();
    const errorsFlashed = req.flash('errors');
    const successFlashed = req.flash('success');
    return {
      page: 'pages/lostpassword',
      seo: templateData?.defaultSeo,
      pageData: {
        errors: errorsFlashed.length ? JSON.parse(errorsFlashed[0]) : undefined,
        success: successFlashed.length ? successFlashed[0] : undefined,
        redirect,
      },
      templateData,
    };
  }

  @Post('/lost-password')
  async lostPasswordAttempt(@Req() req: Request, @Body() body: any, @Res({passthrough: true}) res: Response, @Query('redirect') redirect: string | undefined) {
    const result = await this.accountService.resetPassword(body.email);
    if (result.errors) {
      req.flash(
        'errors',
        JSON.stringify(result.errors)
      );
      return res.redirect('/lost-password?redirect=' + redirect);
    } else {
      req.flash(
        'success',
        'an email with a new password was sent to your email address'
      );
      return res.redirect('/lost-password?redirect=' + redirect);
    }
  }

  @Get('/account')
  @Render('global')
  async account(@Req() req: any) {
    const templateData = await this.strapiService.getGlobalData();
    const errorsFlashed = req.flash('errors');
    const successFlashed = req.flash('success');

    if (!req.user) {
      return { page: 'pages/404', templateData, pageData: undefined, seo: undefined };
    }

    const arenaPlayer = await this.arenaService.getCurrentPlayer(req.cookies.access_token);
    const codes = await this.strapiService.getCodes(req.user.user_id);

    return {
      page: 'pages/account',
      seo: templateData?.defaultSeo,
      pageData: {
        errors: errorsFlashed.length ? JSON.parse(errorsFlashed[0]) : undefined,
        success: successFlashed.length ? successFlashed[0] : undefined,
        arenaPlayer,
        codes,
        user: req.user,
      },
      templateData,
    };
  }

  @Get('/code')
  async code(@Req() req: any, @Query('code') code: string, @Res() res: Response) {
    if (!req.user) {
      return res.redirect(`/login?redirect=${encodeURIComponent(`code?code=${code}`)}`);
    }
    
    const templateData = await this.strapiService.getGlobalData();
    const errorsFlashed = req.flash('errors');
    const successFlashed = req.flash('success');
    
    let codeEntity: any = null; 
    if (code) {
      codeEntity = await this.strapiService.getUnusedCode(code);
      if (!codeEntity) {
        errorsFlashed.push(JSON.stringify(['the code is not valid or already used']));
      } else {
        this.strapiService.redeemCode(codeEntity.documentId, req.user.user_id);
      }
    }

    return res.render(
      'global',
      {
        page: 'pages/code',
        seo: templateData?.defaultSeo,
        pageData: {
          errors: errorsFlashed.length ? JSON.parse(errorsFlashed[0]) : undefined,
          success: successFlashed.length ? successFlashed[0] : undefined,
          code: codeEntity,
        },
        templateData,
      },
    );
  }

  @Post('/account/change-email')
  async updateEmailAttempt(@Req() req: any, @Body() body: any, @Res({passthrough: true}) res: Response) {
    // Try to log in
    const resultLogin = await this.accountService.login(req.user.email, body.password_verify);
    if (resultLogin.errors) {
      req.flash(
        'errors',
        JSON.stringify(['password verification failed'])
      );
      return res.redirect('/account');
    }

    const result = await this.accountService.updateEmail(body.email, req.cookies.access_token);
    if (result.errors) {
      req.flash(
        'errors',
        JSON.stringify(result.errors)
      );
      return res.redirect('/account');
    } else {
      req.flash(
        'success',
        'the email address was updated successfully. all your devices were disconnected'
      );
      return res.redirect('/account');
    }
  }

  @Get('/account/logout')
  async logout(@Req() req: any, @Res({passthrough: true}) res: Response) {
      req.flash(
        'success',
        'you were discconnected successfully'
      );
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return res.redirect('/');
  }

  @Post('/account/change-password')
  async updatePasswordAttempt(@Req() req: any, @Body() body: any, @Res({passthrough: true}) res: Response) {
    // Try to log in
    const resultLogin = await this.accountService.login(req.user.email, body.password_verify);
    if (resultLogin.errors) {
      req.flash(
        'errors',
        JSON.stringify(['password verification failed'])
      );
      return res.redirect('/account');
    }
    
    if (body.password != body.password_confirm) {
      req.flash(
        'errors',
        JSON.stringify(['the passwords are not matching'])
      );
      return res.redirect('/register');
    }

    const result = await this.accountService.updatePassword(body.password, req.cookies.access_token);
    if (result.errors) {
      req.flash(
        'errors',
        JSON.stringify(result.errors)
      );
      return res.redirect('/account');
    } else {
      req.flash(
        'success',
        'the password was updated successfully. all your devices were disconnected'
      );
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
    const path = req.path.replace(/^\//, '');
    const page = await this.getPage(path);
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
      seo: pageData?.seo ? pageData.seo : templateData?.defaultSeo,
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
