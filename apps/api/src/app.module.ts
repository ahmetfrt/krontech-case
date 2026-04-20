import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PagesModule } from './pages/pages.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { BlogModule } from './blog/blog.module';
import { ResourcesModule } from './resources/resources.module';
import { FormsModule } from './forms/forms.module';
import { MediaModule } from './media/media.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PreviewModule } from './preview/preview.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PublishingModule } from './publishing/publishing.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
]),
    PrismaModule,
    UsersModule,
    AuthModule,
    PagesModule,
    ProductsModule,
    BlogModule,
    ResourcesModule,
    FormsModule,
    MediaModule,
    PreviewModule,
    ScheduleModule.forRoot(),
    PublishingModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}