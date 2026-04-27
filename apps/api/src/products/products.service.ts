import { Injectable, NotFoundException } from '@nestjs/common';
import { Locale, Prisma, PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
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
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionsService: VersionsService,
    private readonly cacheService: CacheService,
    private readonly revalidateService: RevalidateService,
    private readonly mediaService: MediaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateProductDto, userId?: string) {
    const product = await this.prisma.product.create({
      data: {
        productCode: dto.productCode,
        heroImageId: dto.heroImageId,
        ...createPublishingFields({
          status: dto.status,
          scheduledAt: dto.scheduledAt,
        }),
        translations: {
          create: dto.translations.map((translation) =>
            this.toTranslationCreateInput(translation),
          ),
        },
      },
      include: {
        heroImage: true,
        translations: true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CONTENT_CREATE',
      entityType: 'PRODUCT',
      entityId: product.id,
      metaJson: {
        productCode: product.productCode,
        status: product.status,
      },
    });

    return this.withMediaUrls(product);
  }

  async findAll() {
    const products = await this.prisma.product.findMany({
      include: {
        heroImage: true,
        translations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => this.withMediaUrls(product));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        heroImage: true,
        translations: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.withMediaUrls(product);
  }

  async update(id: string, dto: UpdateProductDto, userId?: string) {
    const existing = await this.findOne(id);

    await this.versionsService.createVersion({
      entityType: 'PRODUCT',
      entityId: id,
      snapshotJson: existing as Prisma.InputJsonValue,
      createdById: userId,
      note: 'Before product update',
    });

    if (dto.translations) {
      await this.prisma.productTranslation.deleteMany({
        where: { productId: id },
      });
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        productCode: dto.productCode,
        heroImageId:
          dto.heroImageId === undefined ? undefined : dto.heroImageId,
        ...updatePublishingFields({
          status: dto.status,
          scheduledAt: dto.scheduledAt,
        }),
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
        heroImage: true,
      },
    });

    await this.cacheService.delByPrefix('product:');
    await this.auditService.log({
      userId,
      action: 'CONTENT_UPDATE',
      entityType: 'PRODUCT',
      entityId: updated.id,
      metaJson: {
        previousStatus: existing.status,
        productCode: updated.productCode,
        status: updated.status,
      },
    });

    return this.withMediaUrls(updated);
  }

  async publish(id: string, userId?: string) {
    await this.findOne(id);

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
        scheduledAt: null,
      },
      include: {
        translations: true,
        heroImage: true,
      },
    });

    await this.cacheService.delByPrefix('product:');

    const tr = updated.translations.find((t) => t.locale === 'TR');
    const en = updated.translations.find((t) => t.locale === 'EN');

    if (tr?.slug) {
      await this.revalidateService.revalidatePath('/tr/products');
      await this.revalidateService.revalidatePath(`/tr/products/${tr.slug}`);
    }
    if (en?.slug) {
      await this.revalidateService.revalidatePath('/en/products');
      await this.revalidateService.revalidatePath(`/en/products/${en.slug}`);
    }

    await this.auditService.log({
      userId,
      action: 'CONTENT_PUBLISH',
      entityType: 'PRODUCT',
      entityId: updated.id,
      metaJson: {
        productCode: updated.productCode,
        trigger: 'manual',
      },
    });

    return this.withMediaUrls(updated);
  }

  async findPublishedList(locale: string) {
    const apiLocale = this.toLocale(locale);
    const cacheKey = `product:list:${apiLocale}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const products = await this.prisma.product.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        translations: {
          some: {
            locale: apiLocale,
          },
        },
      },
      include: {
        heroImage: true,
        translations: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    const productsWithMedia = products.map((product) =>
      this.withMediaUrls(product),
    );

    await this.cacheService.set(cacheKey, productsWithMedia, 300);

    return productsWithMedia;
  }

  async findPublishedByLocaleAndSlug(locale: string, slug: string) {
    const apiLocale = this.toLocale(locale);
    const cacheKey = `product:${apiLocale}:${slug}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const product = await this.prisma.product.findFirst({
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
        heroImage: true,
        translations: true,
        resources: {
          include: {
            resource: {
              include: {
                translations: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Published product not found');
    }

    const productWithMedia = this.withMediaUrls(product);

    await this.cacheService.set(cacheKey, productWithMedia, 300);

    return productWithMedia;
  }

  async listVersions(id: string) {
    await this.findOne(id);
    return this.versionsService.listVersions('PRODUCT', id);
  }
  
  async restoreVersion(id: string, versionId: string, userId?: string) {
    await this.findOne(id);

    const version = await this.versionsService.getVersion(versionId);
    const snapshot = asSnapshotRecord(version.snapshotJson);

    await this.prisma.productTranslation.deleteMany({
      where: { productId: id },
    });

    const restored = await this.prisma.product.update({
      where: { id },
      data: {
        productCode: snapshotString(snapshot.productCode) ?? id,
        heroImageId: snapshotNullableString(snapshot.heroImageId),
        status: snapshotStatus(snapshot.status),
        publishedAt: snapshotDate(snapshot.publishedAt),
        scheduledAt: snapshotDate(snapshot.scheduledAt),
        translations: {
          create: snapshotArray(snapshot.translations).map((t) => ({
            locale: snapshotLocale(t.locale),
            title: snapshotString(t.title) ?? '',
            slug: snapshotString(t.slug) ?? '',
            shortDescription: snapshotString(t.shortDescription),
            longDescription: snapshotString(t.longDescription),
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
        heroImage: true,
      },
    });

    await this.cacheService.delByPrefix('product:');
    await this.auditService.log({
      userId,
      action: 'CONTENT_RESTORE',
      entityType: 'PRODUCT',
      entityId: restored.id,
      metaJson: {
        versionId,
      },
    });

    return this.withMediaUrls(restored);
  }    

  private withMediaUrls<T extends { heroImage?: { storageKey: string } | null }>(
    product: T,
  ) {
    return {
      ...product,
      heroImage: this.mediaService.withPublicUrl(product.heroImage),
    };
  }

  private toLocale(locale: string) {
    return locale.toUpperCase() === 'EN' ? Locale.EN : Locale.TR;
  }

  private toTranslationCreateInput(
    translation: CreateProductDto['translations'][number],
  ) {
    return {
      ...translation,
      structuredDataJson: snapshotJson(translation.structuredDataJson),
    };
  }
}
