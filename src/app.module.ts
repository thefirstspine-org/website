import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StrapiModule } from './strapi/strapi.module';
import { ConfigModule } from '@nestjs/config';
import { LocaleModule } from './locale/locale.module';
import { LocaleMiddleware } from './locale/locale.middleware';
import { AccountModule } from './account/account.module';
import { AccountService } from './account/account.service';
import { AccountMiddleware } from './account/account.middleware';
import { ArenaModule } from './arena/arena.module';
import { ArenaService } from './arena/arena.service';

@Module({
  imports: [
    StrapiModule,
    ConfigModule.forRoot(),
    LocaleModule,
    AccountModule,
    ArenaModule,
  ],
  controllers: [AppController],
  providers: [AppService, AccountService, ArenaService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LocaleMiddleware)
      .forRoutes(AppController);
    consumer
      .apply(AccountMiddleware)
      .forRoutes(AppController);
  }
}
