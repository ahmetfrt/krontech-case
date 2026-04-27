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
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourcesService } from './resources.service';
import { RestoreVersionDto } from '../versions/dto/restore-version.dto';


@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.EDITOR)
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  create(@Body() body: CreateResourceDto, @Req() req: AuthenticatedRequest) {
    return this.resourcesService.create(body, req.user.id);
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
  update(
    @Param('id') id: string,
    @Body() body: UpdateResourceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.resourcesService.update(id, body, req.user.id);
  }

  @Patch(':id/publish')
  @Roles(RoleName.ADMIN)
  publish(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.resourcesService.publish(id, req.user.id);
  }

  @Get(':id/versions')
  listVersions(@Param('id') id: string) {
    return this.resourcesService.listVersions(id);
  }

  @Post(':id/restore')
  @Roles(RoleName.ADMIN)
  restoreVersion(
    @Param('id') id: string,
    @Body() body: RestoreVersionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.resourcesService.restoreVersion(id, body.versionId, req.user.id);
  }
}
