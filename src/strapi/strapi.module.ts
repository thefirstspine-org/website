import { Module } from '@nestjs/common';
import { StrapiService } from './strapi.service';

@Module({
  providers: [StrapiService],
  exports: [StrapiService],
})
export class StrapiModule {}
