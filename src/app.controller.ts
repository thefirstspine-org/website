import { Controller, Get, Render, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @Render('global')
  async homepage(@Req() req: Request) {
    const data = await this.appService.getPageData(null);
    return {
      page: 'pages/global',
      pageData: data,
    };
  }

  @Get('*')
  @Render('global')
  async root(@Req() req: Request) {
    const data = await this.appService.getPageData(req.url.replace(/^\//, ''));
    return {
      page: 'pages/global',
      pageData: data,
    };
  }
}
