import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { RestoreVersionDto } from '../versions/dto/restore-version.dto';


@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.EDITOR)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() body: CreateProductDto, @Req() req: AuthenticatedRequest) {
    return this.productsService.create(body, req.user.id);
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
  update(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productsService.update(id, body, req.user.id);
  }

  @Patch(':id/publish')
  @Roles(RoleName.ADMIN)
  publish(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.publish(id, req.user.id);
  }

  @Get(':id/versions')
  listVersions(@Param('id') id: string) {
    return this.productsService.listVersions(id);
  }

  @Post(':id/restore')
  @Roles(RoleName.ADMIN)
  restoreVersion(
    @Param('id') id: string,
    @Body() body: RestoreVersionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productsService.restoreVersion(id, body.versionId, req.user.id);
  }
}
