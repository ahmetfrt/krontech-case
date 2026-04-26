import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { Prisma, PublishStatus } from '@prisma/client';
import { VersionsService } from '../versions/versions.service';
import { CacheService } from '../cache/cache.service';
import { RevalidateService } from '../revalidate/revalidate.service';
import { MediaService } from '../media/media.service';


@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionsService: VersionsService,
    private readonly cacheService: CacheService,
    private readonly revalidateService: RevalidateService,
    private readonly mediaService: MediaService,
  ) {}

  async create(dto: CreateResourceDto) {
    const resource = await this.prisma.resource.create({
      data: {
        resourceType: dto.resourceType,
        status: dto.status ?? PublishStatus.DRAFT,
        fileId: dto.fileId,
        externalUrl: dto.externalUrl,
        translations: {
          create: dto.translations,
        },
      },
      include: {
        file: true,
        translations: true,
      },
    });

    return this.withMediaUrls(resource);
  }

  async findAll() {
    const resources = await this.prisma.resource.findMany({
      include: {
        file: true,
        translations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return resources.map((resource) => this.withMediaUrls(resource));
  }

  async findOne(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        file: true,
        translations: true,
      },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return this.withMediaUrls(resource);
  }

  async update(id: string, dto: UpdateResourceDto) {
    const existing = await this.findOne(id);

    await this.versionsService.createVersion({
      entityType: 'RESOURCE',
      entityId: id,
      snapshotJson: existing as Prisma.InputJsonValue,
      note: 'Before resource update',
    });

    if (dto.translations) {
      await this.prisma.resourceTranslation.deleteMany({
        where: { resourceId: id },
      });
    }

    const updated = await this.prisma.resource.update({
      where: { id },
      data: {
        resourceType: dto.resourceType,
        status: dto.status,
        fileId: dto.fileId === undefined ? undefined : dto.fileId,
        externalUrl: dto.externalUrl,
        translations: dto.translations
          ? {
              create: dto.translations,
            }
          : undefined,
      },
      include: {
        file: true,
        translations: true,
      },
    });

    await this.cacheService.delByPrefix('resource:');
    
    return this.withMediaUrls(updated);
  }

  async publish(id: string) {
    await this.findOne(id);

    const updated = await this.prisma.resource.update({
      where: { id },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: {
        file: true,
        translations: true,
      },
    });
    await this.cacheService.delByPrefix('resource:');

    const tr = updated.translations.find((t) => t.locale === 'TR'); 
    const en = updated.translations.find((t) => t.locale === 'EN');

    if (tr?.slug) {
      await this.revalidateService.revalidatePath(`/tr/resources`);
    }
    if (en?.slug) {
      await this.revalidateService.revalidatePath(`/en/resources`);
    }

    return this.withMediaUrls(updated);
  }

  async findPublishedList(locale: string) {
    const cacheKey = `resource:list:${locale}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }


    const resources = await this.prisma.resource.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        translations: {
          some: {
            locale: locale as any,
          },
        },
      },
      include: {
        file: true,
        translations: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    const resourcesWithMedia = resources.map((resource) =>
      this.withMediaUrls(resource),
    );

    await this.cacheService.set(cacheKey, resourcesWithMedia, 300);

    return resourcesWithMedia;
  }

  async findPublishedByLocaleAndSlug(locale: string, slug: string) {
    const cacheKey = `resource:${locale}:${slug}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const resource = await this.prisma.resource.findFirst({
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
        file: true,
        translations: true,
      },
    });

    if (!resource) {
      throw new NotFoundException('Published resource not found');
    }

    const resourceWithMedia = this.withMediaUrls(resource);

    await this.cacheService.set(cacheKey, resourceWithMedia, 300);

    return resourceWithMedia;
  }

  async listVersions(id: string) {
    await this.findOne(id);
    return this.versionsService.listVersions('RESOURCE', id);
  }

  async restoreVersion(id: string, versionId: string) {
    await this.findOne(id);

    const version = await this.versionsService.getVersion(versionId);
    const snapshot = version.snapshotJson as any;

    await this.prisma.resourceTranslation.deleteMany({
      where: { resourceId: id },
    });

    return this.prisma.resource.update({
      where: { id },
      data: {
        resourceType: snapshot.resourceType,
        status: snapshot.status,
        fileId: snapshot.fileId ?? null,
        externalUrl: snapshot.externalUrl,
        publishedAt: snapshot.publishedAt ? new Date(snapshot.publishedAt) : null,
        scheduledAt: snapshot.scheduledAt ? new Date(snapshot.scheduledAt) : null,
        translations: {
          create: (snapshot.translations || []).map((t: any) => ({
            locale: t.locale,
            title: t.title,
            slug: t.slug,
            summary: t.summary,
            seoTitle: t.seoTitle,
            seoDescription: t.seoDescription,
          })),
        },
      },
      include: {
        file: true,
        translations: true,
      },
    });
  }

  private withMediaUrls<T extends { file?: { storageKey: string } | null }>(
    resource: T,
  ) {
    return {
      ...resource,
      file: this.mediaService.withPublicUrl(resource.file),
    };
  }
}
