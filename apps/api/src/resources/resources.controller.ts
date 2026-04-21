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
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourcesService } from './resources.service';
import { RestoreVersionDto } from '../versions/dto/restore-version.dto';


@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  create(@Body() body: CreateResourceDto) {
    return this.resourcesService.create(body);
  }

  @Get()
  findAll() {
    return this.resourcesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateResourceDto) {
    return this.resourcesService.update(id, body);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.resourcesService.publish(id);
  }

  @Get(':id/versions')
  listVersions(@Param('id') id: string) {
    return this.resourcesService.listVersions(id);
  }

  @Post(':id/restore')
  restoreVersion(
    @Param('id') id: string,
    @Body() body: RestoreVersionDto,
  ) {
    return this.resourcesService.restoreVersion(id, body.versionId);
  }
}