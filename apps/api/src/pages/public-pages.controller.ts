import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PagesService } from './pages.service';

@ApiTags('public-pages')
@Controller('public/pages')
export class PublicPagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get(':locale')
  findList(@Param('locale') locale: string) {
    return this.pagesService.findPublishedList(locale);
  }

  @Get(':locale/:slug')
  findOneByLocaleAndSlug(
    @Param('locale') locale: string,
    @Param('slug') slug: string,
  ) {
    return this.pagesService.findPublishedByLocaleAndSlug(locale, slug);
  }
}
