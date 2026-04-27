import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { Locale, Prisma, PublishStatus } from '@prisma/client';
import { VersionsService } from '../versions/versions.service';
import { CacheService } from '../cache/cache.service';
import { RevalidateService } from '../revalidate/revalidate.service';
import { MediaService } from '../media/media.service';
import { AuditService } from '../audit/audit.service';
import {
  createPublishingFields,
  updatePublishingFields,
} from '../publishing/publishing-fields';
import {
  asSnapshotRecord,
  snapshotArray,
  snapshotBoolean,
  snapshotDate,
  snapshotJson,
  snapshotLocale,
  snapshotNullableString,
  snapshotStatus,
  snapshotString,
} from '../versions/version-snapshot';


@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionsService: VersionsService,
    private readonly cacheService: CacheService,
    private readonly revalidateService: RevalidateService,
    private readonly mediaService: MediaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateBlogPostDto, userId?: string) {
    const post = await this.prisma.blogPost.create({
      data: {
        ...createPublishingFields({
          status: dto.status,
          scheduledAt: dto.scheduledAt,
        }),
        authorName: dto.authorName,
        featuredImageId: dto.featuredImageId,
        translations: {
          create: dto.translations.map((translation) =>
            this.toTranslationCreateInput(translation),
          ),
        },
      },
      include: {
        translations: true,
        featuredImage: true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CONTENT_CREATE',
      entityType: 'BLOG_POST',
      entityId: post.id,
      metaJson: {
        authorName: post.authorName,
        status: post.status,
      },
    });

    return this.withMediaUrls(post);
  }

  async findAll() {
    const posts = await this.prisma.blogPost.findMany({
      include: {
        translations: true,
        featuredImage: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return posts.map((post) => this.withMediaUrls(post));
  }

  async findOne(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        translations: true,
        featuredImage: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    return this.withMediaUrls(post);
  }

  async update(id: string, dto: UpdateBlogPostDto, userId?: string) {
    const existing = await this.findOne(id);

    await this.versionsService.createVersion({
      entityType: 'BLOG_POST',
      entityId: id,
      snapshotJson: existing as Prisma.InputJsonValue,
      createdById: userId,
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
        ...updatePublishingFields({
          status: dto.status,
          scheduledAt: dto.scheduledAt,
        }),
        authorName: dto.authorName,
        featuredImageId:
          dto.featuredImageId === undefined ? undefined : dto.featuredImageId,
        translations: dto.translations
          ? {
              create: dto.translations.map((translation) =>
                this.toTranslationCreateInput(translation),
              ),
            }
          : undefined,
      },
      include: {
        translations: true,
        featuredImage: true,
      },
    });

    await this.cacheService.delByPrefix('blog:');
    await this.auditService.log({
      userId,
      action: 'CONTENT_UPDATE',
      entityType: 'BLOG_POST',
      entityId: updated.id,
      metaJson: {
        previousStatus: existing.status,
        status: updated.status,
      },
    });
    
    return this.withMediaUrls(updated);
  }

  async publish(id: string, userId?: string) {
    await this.findOne(id);

    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
        scheduledAt: null,
      },
      include: {
        translations: true,
        featuredImage: true,
      },
    });
    
    await this.cacheService.delByPrefix('blog:');

    const tr = updated.translations.find((t) => t.locale === 'TR');
    const en = updated.translations.find((t) => t.locale === 'EN');

    if (tr?.slug) {
      await this.revalidateService.revalidatePath('/tr/blog');
      await this.revalidateService.revalidatePath(`/tr/blog/${tr.slug}`);
    }
    if (en?.slug) {
      await this.revalidateService.revalidatePath('/en/blog');
      await this.revalidateService.revalidatePath(`/en/blog/${en.slug}`);
    }

    await this.auditService.log({
      userId,
      action: 'CONTENT_PUBLISH',
      entityType: 'BLOG_POST',
      entityId: updated.id,
      metaJson: {
        trigger: 'manual',
      },
    });

    return this.withMediaUrls(updated);
  }

  async findPublishedList(locale: string) {
    const apiLocale = this.toLocale(locale);
    const posts = await this.prisma.blogPost.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        translations: {
          some: {
            locale: apiLocale,
          },
        },
      },
      include: {
        translations: true,
        featuredImage: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    return posts.map((post) => this.withMediaUrls(post));
  }

  async findPublishedByLocaleAndSlug(locale: string, slug: string) {
    const apiLocale = this.toLocale(locale);
    const cacheKey = `blog:${apiLocale}:${slug}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const post = await this.prisma.blogPost.findFirst({
      where: {
        status: PublishStatus.PUBLISHED,
        translations: {
          some: {
            locale: apiLocale,
            slug,
          },
        },
      },
      include: {
        translations: true,
        featuredImage: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Published blog post not found');
    }

    const postWithMedia = this.withMediaUrls(post);

    await this.cacheService.set(cacheKey, postWithMedia, 300);

    return postWithMedia;
  }

  async listVersions(id: string) {
    await this.findOne(id);
    return this.versionsService.listVersions('BLOG_POST', id);
  }

  async restoreVersion(id: string, versionId: string, userId?: string) {
    await this.findOne(id);

    const version = await this.versionsService.getVersion(versionId);
    const snapshot = asSnapshotRecord(version.snapshotJson);

    await this.prisma.blogPostTranslation.deleteMany({
      where: { blogPostId: id },
    });

    const restored = await this.prisma.blogPost.update({
      where: { id },
      data: {
        status: snapshotStatus(snapshot.status),
        authorName: snapshotNullableString(snapshot.authorName),
        featuredImageId: snapshotNullableString(snapshot.featuredImageId),
        publishedAt: snapshotDate(snapshot.publishedAt),
        scheduledAt: snapshotDate(snapshot.scheduledAt),
        translations: {
          create: snapshotArray(snapshot.translations).map((t) => ({
            locale: snapshotLocale(t.locale),
            title: snapshotString(t.title) ?? '',
            slug: snapshotString(t.slug) ?? '',
            excerpt: snapshotString(t.excerpt),
            content: snapshotString(t.content),
            seoTitle: snapshotString(t.seoTitle),
            seoDescription: snapshotString(t.seoDescription),
            ogTitle: snapshotString(t.ogTitle),
            ogDescription: snapshotString(t.ogDescription),
            canonicalUrl: snapshotString(t.canonicalUrl),
            robotsIndex: snapshotBoolean(t.robotsIndex),
            robotsFollow: snapshotBoolean(t.robotsFollow),
            structuredDataJson: snapshotJson(t.structuredDataJson),
          })),
        },
      },
      include: {
        translations: true,
        featuredImage: true,
      },
    });

    await this.cacheService.delByPrefix('blog:');
    await this.auditService.log({
      userId,
      action: 'CONTENT_RESTORE',
      entityType: 'BLOG_POST',
      entityId: restored.id,
      metaJson: {
        versionId,
      },
    });

    return this.withMediaUrls(restored);
  }

  private withMediaUrls<
    T extends { featuredImage?: { storageKey: string } | null },
  >(post: T) {
    return {
      ...post,
      featuredImage: this.mediaService.withPublicUrl(post.featuredImage),
    };
  }

  private toLocale(locale: string) {
    return locale.toUpperCase() === 'EN' ? Locale.EN : Locale.TR;
  }

  private toTranslationCreateInput(
    translation: CreateBlogPostDto['translations'][number],
  ) {
    return {
      ...translation,
      structuredDataJson: snapshotJson(translation.structuredDataJson),
    };
  }
}
