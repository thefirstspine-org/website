import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StrapiModule } from './strapi/strapi.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    StrapiModule,
    ConfigModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
