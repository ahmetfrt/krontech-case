import { Injectable, NotFoundException } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBlogPostDto) {
    return this.prisma.blogPost.create({
      data: {
        status: dto.status ?? PublishStatus.DRAFT,
        authorName: dto.authorName,
        translations: {
          create: dto.translations,
        },
      },
      include: {
        translations: true,
      },
    });
  }

  async findAll() {
    return this.prisma.blogPost.findMany({
      include: {
        translations: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    return post;
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    await this.findOne(id);

    if (dto.translations) {
      await this.prisma.blogPostTranslation.deleteMany({
        where: { blogPostId: id },
      });
    }

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        status: dto.status,
        authorName: dto.authorName,
        translations: dto.translations
          ? {
              create: dto.translations,
            }
          : undefined,
      },
      include: {
        translations: true,
      },
    });
  }

  async publish(id: string) {
    await this.findOne(id);

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: {
        translations: true,
      },
    });
  }

  async findPublishedList(locale: string) {
    return this.prisma.blogPost.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        translations: {
          some: {
            locale: locale as any,
          },
        },
      },
      include: {
        translations: true,
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findPublishedByLocaleAndSlug(locale: string, slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: {
        status: PublishStatus.PUBLISHED,
        translations: {
          some: {
            locale: locale as any,
            slug,
          },
        },
      },
      include: {
        translations: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Published blog post not found');
    }

    return post;
  }
}