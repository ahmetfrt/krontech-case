import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PublicPagesController } from './public-pages.controller';
import { PagesService } from './pages.service';

@Module({
  controllers: [PagesController, PublicPagesController],
  providers: [PagesService],
})
export class PagesModule {}