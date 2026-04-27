import { Injectable, NotFoundException } from '@nestjs/common';
import { Locale, Prisma, PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { VersionsService } from '../versions/versions.service';
import { CacheService } from '../cache/cache.service';
import { RevalidateService } from '../revalidate/revalidate.service';
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
  snapshotPageType,
  snapshotStatus,
  snapshotString,
} from '../versions/version-snapshot';


@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionsService: VersionsService,
    private readonly cacheService: CacheService,
    private readonly revalidateService: RevalidateService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreatePageDto, userId?: string) {
    const page = await this.prisma.page.create({
      data: {
        pageType: dto.pageType,
        ...createPublishingFields({
          status: dto.status,
          scheduledAt: dto.scheduledAt,
        }),
        createdById: userId,
        updatedById: userId,
        translations: {
          create: dto.translations.map((translation) =>
            this.toTranslationCreateInput(translation),
          ),
        },
        blocks: {
          create: dto.blocks.map((block) => ({
            type: block.type,
            sortOrder: block.sortOrder,
            configJson: snapshotJson(block.configJson) ?? {},
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

    await this.auditService.log({
      userId,
      action: 'CONTENT_CREATE',
      entityType: 'PAGE',
      entityId: page.id,
      metaJson: {
        pageType: page.pageType,
        status: page.status,
      },
    });

    return page;
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
        ...updatePublishingFields({
          status: dto.status,
          scheduledAt: dto.scheduledAt,
        }),
        updatedById: userId,
        translations: dto.translations
          ? {
              create: dto.translations.map((translation) =>
                this.toTranslationCreateInput(translation),
              ),
            }
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
    await this.auditService.log({
      userId,
      action: 'CONTENT_UPDATE',
      entityType: 'PAGE',
      entityId: updated.id,
      metaJson: {
        previousStatus: existing.status,
        status: updated.status,
      },
    });

    return updated;
  }

  async publish(id: string, userId?: string) {
    await this.findOne(id);

    const updated = await this.prisma.page.update({
      where: { id },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
        scheduledAt: null,
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
      await this.revalidateService.revalidatePath(this.buildPagePath('tr', tr.slug));
    }

    if (en?.slug) {
      await this.revalidateService.revalidatePath(this.buildPagePath('en', en.slug));
    }

    await this.auditService.log({
      userId,
      action: 'CONTENT_PUBLISH',
      entityType: 'PAGE',
      entityId: updated.id,
      metaJson: {
        trigger: 'manual',
      },
    });

    return updated;
  }

  async findPublishedList(locale: string) {
    const apiLocale = this.toLocale(locale);
    const cacheKey = `page:list:${apiLocale}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const pages = await this.prisma.page.findMany({
      where: {
        status: 'PUBLISHED',
        translations: {
          some: {
            locale: apiLocale,
          },
        },
      },
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    await this.cacheService.set(cacheKey, pages, 300);

    return pages;
  }

  async findPublishedByLocaleAndSlug(locale: string, slug: string) {
    const apiLocale = this.toLocale(locale);
    const cacheKey = `page:${apiLocale}:${slug}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const page = await this.prisma.page.findFirst({
      where: {
        status: 'PUBLISHED',
        translations: {
          some: {
            locale: apiLocale,
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
    const snapshot = asSnapshotRecord(version.snapshotJson);

    await this.prisma.pageTranslation.deleteMany({ where: { pageId: id } });
    await this.prisma.pageBlock.deleteMany({ where: { pageId: id } });

    const restored = await this.prisma.page.update({
      where: { id },
      data: {
        pageType: snapshotPageType(snapshot.pageType),
        status: snapshotStatus(snapshot.status),
        publishedAt: snapshotDate(snapshot.publishedAt),
        scheduledAt: snapshotDate(snapshot.scheduledAt),
        updatedById: userId,
        translations: {
          create: snapshotArray(snapshot.translations).map((t) => ({
            locale: snapshotLocale(t.locale),
            title: snapshotString(t.title) ?? '',
            slug: snapshotString(t.slug) ?? '',
            summary: snapshotString(t.summary),
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
        blocks: {
          create: snapshotArray(snapshot.blocks).map((block, index) => ({
            type: snapshotString(block.type) ?? 'content',
            sortOrder:
              typeof block.sortOrder === 'number' ? block.sortOrder : index,
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

    await this.cacheService.delByPrefix('page:');
    await this.auditService.log({
      userId,
      action: 'CONTENT_RESTORE',
      entityType: 'PAGE',
      entityId: restored.id,
      metaJson: {
        versionId,
      },
    });

    return restored;
  }

  private buildPagePath(locale: 'en' | 'tr', slug: string) {
    if (
      (locale === 'tr' && slug === 'ana-sayfa') ||
      (locale === 'en' && slug === 'home-page')
    ) {
      return `/${locale}`;
    }

    return `/${locale}/${slug}`;
  }

  private toLocale(locale: string) {
    return locale.toUpperCase() === 'EN' ? Locale.EN : Locale.TR;
  }

  private toTranslationCreateInput(translation: CreatePageDto['translations'][number]) {
    return {
      ...translation,
      structuredDataJson: snapshotJson(translation.structuredDataJson),
    };
  }
}
