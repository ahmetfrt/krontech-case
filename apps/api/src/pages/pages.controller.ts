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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PagesService } from './pages.service';
import { RestoreVersionDto } from '../versions/dto/restore-version.dto';


type AuthenticatedRequest = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

@ApiTags('pages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Post()
  create(@Body() body: CreatePageDto, @Req() req: AuthenticatedRequest) {
    return this.pagesService.create(body, req.user.id);
  }

  @Get()
  findAll() {
    return this.pagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdatePageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.pagesService.update(id, body, req.user.id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.pagesService.publish(id, req.user.id);
  }

  @Get(':id/versions')
  listVersions(@Param('id') id: string) {
    return this.pagesService.listVersions(id);
  }

  @Post(':id/restore')
  restoreVersion(
    @Param('id') id: string,
    @Body() body: RestoreVersionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.pagesService.restoreVersion(id, body.versionId, req.user.id);
  }
}