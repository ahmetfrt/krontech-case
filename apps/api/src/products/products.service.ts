import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { VersionsService } from '../versions/versions.service';
import { CacheService } from '../cache/cache.service';
import { RevalidateService } from '../revalidate/revalidate.service';
import { MediaService } from '../media/media.service';
import { AuditService } from '../audit/audit.service';


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
        status: dto.status ?? PublishStatus.DRAFT,
        translations: {
          create: dto.translations,
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
        status: dto.status,
        translations: dto.translations
          ? {
              create: dto.translations,
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
    const cacheKey = `product:list:${locale}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const products = await this.prisma.product.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        translations: {
          some: {
            locale: locale as any,
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
    const cacheKey = `product:${locale}:${slug}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const product = await this.prisma.product.findFirst({
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
    const snapshot = version.snapshotJson as any;

    await this.prisma.productTranslation.deleteMany({
      where: { productId: id },
    });

    const restored = await this.prisma.product.update({
      where: { id },
      data: {
        productCode: snapshot.productCode,
        heroImageId: snapshot.heroImageId ?? null,
        status: snapshot.status,
        publishedAt: snapshot.publishedAt ? new Date(snapshot.publishedAt) : null,
        scheduledAt: snapshot.scheduledAt ? new Date(snapshot.scheduledAt) : null,
        translations: {
          create: (snapshot.translations || []).map((t: any) => ({
            locale: t.locale,
            title: t.title,
            slug: t.slug,
            shortDescription: t.shortDescription,
            longDescription: t.longDescription,
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
}
