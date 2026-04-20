import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BlogService } from './blog.service';

@ApiTags('public-blog')
@Controller('public/blog')
export class PublicBlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get(':locale')
  findList(@Param('locale') locale: string) {
    return this.blogService.findPublishedList(locale);
  }

  @Get(':locale/:slug')
  findOne(@Param('locale') locale: string, @Param('slug') slug: string) {
    return this.blogService.findPublishedByLocaleAndSlug(locale, slug);
  }
}