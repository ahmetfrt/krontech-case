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


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    PagesModule,
    ProductsModule,
    BlogModule,
    ResourcesModule,
    FormsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}