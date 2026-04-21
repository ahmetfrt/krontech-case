import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { VersionsService } from '../versions/versions.service';
import { CacheService } from '../cache/cache.service';
import { RevalidateService } from '../revalidate/revalidate.service';


@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionsService: VersionsService,
    private readonly cacheService: CacheService,
    private readonly revalidateService: RevalidateService
  ) {}

  async create(dto: CreatePageDto, userId?: string) {
    return this.prisma.page.create({
      data: {
        pageType: dto.pageType,
        status: dto.status ?? PublishStatus.DRAFT,
        createdById: userId,
        updatedById: userId,
        translations: {
          create: dto.translations,
        },
        blocks: {
          create: dto.blocks.map((block) => ({
            type: block.type,
            sortOrder: block.sortOrder,
            configJson: block.configJson as Prisma.InputJsonValue,
          })),
        },
      },
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.page.findMany({
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async update(id: string, dto: UpdatePageDto, userId?: string) {
    const existing = await this.findOne(id);

    await this.versionsService.createVersion({
      entityType: 'PAGE',
      entityId: id,
      snapshotJson: existing as Prisma.InputJsonValue,
      createdById: userId,
      note: 'Before page update',
    });

    if (dto.translations || dto.blocks) {
      await this.prisma.pageTranslation.deleteMany({ where: { pageId: id } });
      await this.prisma.pageBlock.deleteMany({ where: { pageId: id } });
    }

    const updated = await this.prisma.page.update({
      where: { id },
      data: {
        pageType: dto.pageType,
        status: dto.status,
        updatedById: userId,
        translations: dto.translations
          ? {create: dto.translations}
          : undefined,
        blocks: dto.blocks
          ? {
              create: dto.blocks.map((block) => ({
                type: block.type,
                sortOrder: block.sortOrder,
                configJson: block.configJson as Prisma.InputJsonValue,
              })),
            }
          : undefined,
      },
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    await this.cacheService.delByPrefix('page:');

    return updated;
  }

  async publish(id: string, userId?: string) {
    await this.findOne(id);

    const updated = await this.prisma.page.update({
      where: { id },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
        updatedById: userId,
      },
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    await this.cacheService.delByPrefix(`page:`);

    const tr = updated.translations.find((t) => t.locale === 'TR');
    const en = updated.translations.find((t) => t.locale === 'EN');

    if (tr?.slug) {
      await this.revalidateService.revalidatePath('/tr');
    }

    if (en?.slug) {
      await this.revalidateService.revalidatePath('/en');
    }

    return updated;
  }

  async findPublishedByLocaleAndSlug(locale: string, slug: string) {
    const cacheKey = `page:${locale}:${slug}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const page = await this.prisma.page.findFirst({
      where: {
        status: 'PUBLISHED',
        translations: {
          some: {
            locale: locale as any,
            slug,
          },
        },
      },
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Published page not found');
    }

    await this.cacheService.set(cacheKey, page, 300);

    return page;
  }
  
  async listVersions(id: string) {
    await this.findOne(id);
    return this.versionsService.listVersions('PAGE', id);
  }

  async restoreVersion(id: string, versionId: string, userId?: string) {
    await this.findOne(id);

    const version = await this.versionsService.getVersion(versionId);
    const snapshot = version.snapshotJson as any;

    await this.prisma.pageTranslation.deleteMany({ where: { pageId: id } });
    await this.prisma.pageBlock.deleteMany({ where: { pageId: id } });

    return this.prisma.page.update({
      where: { id },
      data: {
        pageType: snapshot.pageType,
        status: snapshot.status,
        publishedAt: snapshot.publishedAt ? new Date(snapshot.publishedAt) : null,
        scheduledAt: snapshot.scheduledAt ? new Date(snapshot.scheduledAt) : null,
        updatedById: userId,
        translations: {
          create: (snapshot.translations || []).map((t: any) => ({
            locale: t.locale,
            title: t.title,
            slug: t.slug,
            summary: t.summary,
            seoTitle: t.seoTitle,
            seoDescription: t.seoDescription,
            ogTitle: t.ogTitle,
            ogDescription: t.ogDescription,
            canonicalUrl: t.canonicalUrl,
            robotsIndex: t.robotsIndex,
            robotsFollow: t.robotsFollow,
          })),
        },
        blocks: {
          create: (snapshot.blocks || []).map((block: any) => ({
            type: block.type,
            sortOrder: block.sortOrder,
            configJson: block.configJson as Prisma.InputJsonValue,
          })),
        },
      },
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }
}