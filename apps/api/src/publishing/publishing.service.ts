import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Locale, PublishStatus } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { RevalidateService } from '../revalidate/revalidate.service';

type ScheduledTranslation = {
  locale: Locale;
  slug: string;
};

@Injectable()
export class PublishingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly revalidateService: RevalidateService,
  ) {}

  @Cron('*/30 * * * * *')
  async publishScheduledContent() {
    const now = new Date();

    const [pages, products, blogPosts, resources] = await Promise.all([
      this.prisma.page.findMany({
        where: {
          status: PublishStatus.SCHEDULED,
          scheduledAt: { lte: now },
        },
        include: {
          translations: true,
        },
      }),
      this.prisma.product.findMany({
        where: {
          status: PublishStatus.SCHEDULED,
          scheduledAt: { lte: now },
        },
        include: {
          translations: true,
        },
      }),
      this.prisma.blogPost.findMany({
        where: {
          status: PublishStatus.SCHEDULED,
          scheduledAt: { lte: now },
        },
        include: {
          translations: true,
        },
      }),
      this.prisma.resource.findMany({
        where: {
          status: PublishStatus.SCHEDULED,
          scheduledAt: { lte: now },
        },
        include: {
          translations: true,
        },
      }),
    ]);

    await Promise.all([
      ...pages.map((page) =>
        this.prisma.page.update({
          where: { id: page.id },
          data: {
            status: PublishStatus.PUBLISHED,
            publishedAt: now,
            scheduledAt: null,
          },
        }),
      ),
      ...products.map((product) =>
        this.prisma.product.update({
          where: { id: product.id },
          data: {
            status: PublishStatus.PUBLISHED,
            publishedAt: now,
            scheduledAt: null,
          },
        }),
      ),
      ...blogPosts.map((post) =>
        this.prisma.blogPost.update({
          where: { id: post.id },
          data: {
            status: PublishStatus.PUBLISHED,
            publishedAt: now,
            scheduledAt: null,
          },
        }),
      ),
      ...resources.map((resource) =>
        this.prisma.resource.update({
          where: { id: resource.id },
          data: {
            status: PublishStatus.PUBLISHED,
            publishedAt: now,
            scheduledAt: null,
          },
        }),
      ),
    ]);

    await Promise.all([
      this.purgeAndRevalidatePages(
        pages.flatMap((page) => page.translations),
      ),
      this.purgeAndRevalidateProducts(
        products.flatMap((product) => product.translations),
      ),
      this.purgeAndRevalidateBlogPosts(
        blogPosts.flatMap((post) => post.translations),
      ),
      this.purgeAndRevalidateResources(
        resources.flatMap((resource) => resource.translations),
      ),
    ]);
  }

  private async purgeAndRevalidatePages(translations: ScheduledTranslation[]) {
    if (translations.length === 0) {
      return;
    }

    await this.cacheService.delByPrefix('page:');
    await this.revalidatePaths(
      translations.map((translation) => `/${this.toPathLocale(translation.locale)}`),
    );
  }

  private async purgeAndRevalidateProducts(
    translations: ScheduledTranslation[],
  ) {
    if (translations.length === 0) {
      return;
    }

    await this.cacheService.delByPrefix('product:');
    await this.revalidatePaths([
      ...translations.map(
        (translation) =>
          `/${this.toPathLocale(translation.locale)}/products/${translation.slug}`,
      ),
      ...translations.map(
        (translation) => `/${this.toPathLocale(translation.locale)}/products`,
      ),
    ]);
  }

  private async purgeAndRevalidateBlogPosts(
    translations: ScheduledTranslation[],
  ) {
    if (translations.length === 0) {
      return;
    }

    await this.cacheService.delByPrefix('blog:');
    await this.revalidatePaths([
      ...translations.map(
        (translation) =>
          `/${this.toPathLocale(translation.locale)}/blog/${translation.slug}`,
      ),
      ...translations.map(
        (translation) => `/${this.toPathLocale(translation.locale)}/blog`,
      ),
    ]);
  }

  private async purgeAndRevalidateResources(
    translations: ScheduledTranslation[],
  ) {
    if (translations.length === 0) {
      return;
    }

    await this.cacheService.delByPrefix('resource:');
    await this.revalidatePaths(
      translations.map(
        (translation) => `/${this.toPathLocale(translation.locale)}/resources`,
      ),
    );
  }

  private async revalidatePaths(paths: string[]) {
    await Promise.all(
      [...new Set(paths)].map((path) =>
        this.revalidateService.revalidatePath(path),
      ),
    );
  }

  private toPathLocale(locale: Locale) {
    return locale === Locale.TR ? 'tr' : 'en';
  }
}
