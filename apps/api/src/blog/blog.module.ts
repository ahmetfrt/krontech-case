import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { PublicBlogController } from './public-blog.controller';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [BlogController, PublicBlogController],
  providers: [BlogService],
})
export class BlogModule {}
