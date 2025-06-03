import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { StrapiModule } from './strapi/strapi.module';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      imports: [StrapiModule],
    }).compile();

    appController = app.get<AppController>(AppController);
  });
});
