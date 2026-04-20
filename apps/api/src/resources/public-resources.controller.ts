import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';

@ApiTags('public-resources')
@Controller('public/resources')
export class PublicResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get(':locale')
  findList(@Param('locale') locale: string) {
    return this.resourcesService.findPublishedList(locale);
  }

  @Get(':locale/:slug')
  findOne(@Param('locale') locale: string, @Param('slug') slug: string) {
    return this.resourcesService.findPublishedByLocaleAndSlug(locale, slug);
  }
}