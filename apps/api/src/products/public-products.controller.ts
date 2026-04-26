import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('public-products')
@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(':locale')
  findList(@Param('locale') locale: string) {
    return this.productsService.findPublishedList(locale);
  }

  @Get(':locale/:slug')
  findByLocaleAndSlug(
    @Param('locale') locale: string,
    @Param('slug') slug: string,
  ) {
    return this.productsService.findPublishedByLocaleAndSlug(locale, slug);
  }
}
