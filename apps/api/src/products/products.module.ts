import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { PublicProductsController } from './public-products.controller';
import { ProductsService } from './products.service';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [ProductsController, PublicProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
