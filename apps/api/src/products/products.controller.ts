import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { RestoreVersionDto } from '../versions/dto/restore-version.dto';


@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.productsService.update(id, body);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.productsService.publish(id);
  }

  @Get(':id/versions')
  listVersions(@Param('id') id: string) {
    return this.productsService.listVersions(id);
  }

  @Post(':id/restore')
  restoreVersion(
    @Param('id') id: string,
    @Body() body: RestoreVersionDto,
  ) {
    return this.productsService.restoreVersion(id, body.versionId);
  }
}