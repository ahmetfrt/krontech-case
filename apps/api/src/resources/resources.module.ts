import { Module } from '@nestjs/common';
import { PublicResourcesController } from './public-resources.controller';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Module({
  controllers: [ResourcesController, PublicResourcesController],
  providers: [ResourcesService],
})
export class ResourcesModule {}