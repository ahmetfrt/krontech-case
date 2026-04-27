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
import { BlogService } from './blog.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { RestoreVersionDto } from '../versions/dto/restore-version.dto';

@ApiTags('blog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.EDITOR)
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  create(@Body() body: CreateBlogPostDto, @Req() req: AuthenticatedRequest) {
    return this.blogService.create(body, req.user.id);
  }

  @Get()
  findAll() {
    return this.blogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateBlogPostDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.blogService.update(id, body, req.user.id);
  }

  @Patch(':id/publish')
  @Roles(RoleName.ADMIN)
  publish(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.blogService.publish(id, req.user.id);
  }

  @Get(':id/versions')
  listVersions(@Param('id') id: string) {
    return this.blogService.listVersions(id);
  }

  @Post(':id/restore')
  @Roles(RoleName.ADMIN)
  restoreVersion(
    @Param('id') id: string,
    @Body() body: RestoreVersionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.blogService.restoreVersion(id, body.versionId, req.user.id);
  }
}
