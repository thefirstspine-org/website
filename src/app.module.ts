import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StrapiModule } from './strapi/strapi.module';

@Module({
  imports: [StrapiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
