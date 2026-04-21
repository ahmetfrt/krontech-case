import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { Prisma, PublishStatus } from '@prisma/client';
import { VersionsService } from '../versions/versions.service';
import { CacheService } from '../cache/cache.service';
import { RevalidateService } from '../revalidate/revalidate.service';


@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionsService: VersionsService,
    private readonly cacheService: CacheService,
    private readonly revalidateService: RevalidateService
  ) {}

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
    const existing = await this.findOne(id);

    await this.versionsService.createVersion({
      entityType: 'BLOG_POST',
      entityId: id,
      snapshotJson: existing as Prisma.InputJsonValue,
      note: 'Before blog update',
    });

    if (dto.translations) {
      await this.prisma.blogPostTranslation.deleteMany({
        where: { blogPostId: id },
      });
    }

    const updated = await this.prisma.blogPost.update({
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

    await this.cacheService.delByPrefix('blog:');
    
    return updated;
  }

  async publish(id: string) {
    await this.findOne(id);

    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: {
        translations: true,
      },
    });
    
    await this.cacheService.delByPrefix('blog:');

    const tr = updated.translations.find((t) => t.locale === 'TR');
    const en = updated.translations.find((t) => t.locale === 'EN');

    if (tr?.slug) {
      await this.revalidateService.revalidatePath(`/tr/blog/${tr.slug}`);
    }
    if (en?.slug) {
      await this.revalidateService.revalidatePath(`/en/blog/${en.slug}`);
    }

    return updated;
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
    const cacheKey = `blog:${locale}:${slug}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

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

    await this.cacheService.set(cacheKey, post, 300);

    return post;
  }

  async listVersions(id: string) {
    await this.findOne(id);
    return this.versionsService.listVersions('BLOG_POST', id);
  }

  async restoreVersion(id: string, versionId: string) {
    await this.findOne(id);

    const version = await this.versionsService.getVersion(versionId);
    const snapshot = version.snapshotJson as any;

    await this.prisma.blogPostTranslation.deleteMany({
      where: { blogPostId: id },
    });

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        status: snapshot.status,
        authorName: snapshot.authorName,
        publishedAt: snapshot.publishedAt ? new Date(snapshot.publishedAt) : null,
        scheduledAt: snapshot.scheduledAt ? new Date(snapshot.scheduledAt) : null,
        translations: {
          create: (snapshot.translations || []).map((t: any) => ({
            locale: t.locale,
            title: t.title,
            slug: t.slug,
            excerpt: t.excerpt,
            content: t.content,
            seoTitle: t.seoTitle,
            seoDescription: t.seoDescription,
            ogTitle: t.ogTitle,
            ogDescription: t.ogDescription,
            canonicalUrl: t.canonicalUrl,
          })),
        },
      },
      include: {
        translations: true,
      },
    });
  }
}