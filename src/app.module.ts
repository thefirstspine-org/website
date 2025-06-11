import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StrapiModule } from './strapi/strapi.module';
import { ConfigModule } from '@nestjs/config';
import { LocaleModule } from './locale/locale.module';
import { LocaleMiddleware } from './locale/locale.middleware';

@Module({
  imports: [
    StrapiModule,
    ConfigModule.forRoot(),
    LocaleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LocaleMiddleware)
      .forRoutes(AppController);
  }
}
