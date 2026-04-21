import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { Prisma, PublishStatus } from '@prisma/client';
import { VersionsService } from '../versions/versions.service';
import { CacheService } from '../cache/cache.service';
import { RevalidateService } from '../revalidate/revalidate.service';


@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionsService: VersionsService,
    private readonly cacheService: CacheService,
    private readonly revalidateService: RevalidateService
  ) {}

  async create(dto: CreateResourceDto) {
    return this.prisma.resource.create({
      data: {
        resourceType: dto.resourceType,
        status: dto.status ?? PublishStatus.DRAFT,
        externalUrl: dto.externalUrl,
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
    return this.prisma.resource.findMany({
      include: {
        translations: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
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
        externalUrl: dto.externalUrl,
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

    await this.cacheService.delByPrefix('resource:');
    
    return updated;
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

    return updated;
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
        translations: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    await this.cacheService.set(cacheKey, resources, 300);

    return resources;
  }

  async findPublishedByLocaleAndSlug(locale: string, slug: string) {
    const cacheKey = `resource:list:${locale}`;
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
        translations: true,
      },
    });

    if (!resource) {
      throw new NotFoundException('Published resource not found');
    }

    await this.cacheService.set(cacheKey, resource, 300);

    return resource;
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
        translations: true,
      },
    });
  }
}