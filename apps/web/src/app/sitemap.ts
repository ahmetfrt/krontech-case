import type { MetadataRoute } from 'next';
import { getPublishedBlogList } from '@/lib/blog';
import { getPublishedResources } from '@/lib/resources';
import { getPublishedProducts } from '@/lib/products';
import { getPublishedPages } from '@/lib/api';
import { buildAbsoluteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type TranslationRoute = {
  locale: string;
  slug?: string | null;
};

type PublishedEntity = {
  pageType?: string;
  publishedAt?: string | Date | null;
  translations?: TranslationRoute[];
  updatedAt?: string | Date | null;
};

async function safeList<T>(loader: () => Promise<T[]>): Promise<T[]> {
  try {
    return await loader();
  } catch {
    return [];
  }
}

function localizedRoutes(
  items: PublishedEntity[],
  locale: 'TR' | 'EN',
  pathBuilder: (slug: string) => string,
): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];

  for (const item of items) {
    const translation = item.translations?.find(
      (entry) => entry.locale === locale,
    );

    if (!translation?.slug) {
      continue;
    }

    routes.push({
      url: buildAbsoluteUrl(pathBuilder(translation.slug)),
      lastModified: item.updatedAt || item.publishedAt || new Date(),
    });
  }

  return routes;
}

function genericPageRoutes(
  items: PublishedEntity[],
  locale: 'TR' | 'EN',
  publicLocale: 'tr' | 'en',
): MetadataRoute.Sitemap {
  const reservedSlugs = new Set([
    locale === 'TR' ? 'ana-sayfa' : 'home-page',
    'products',
    'resources',
    'blog',
    'contact',
  ]);

  return localizedRoutes(
    items.filter((item) => item.pageType === 'STANDARD' || !item.pageType),
    locale,
    (slug) =>
      reservedSlugs.has(slug) ? `/${publicLocale}` : `/${publicLocale}/${slug}`,
  ).filter((route) => !route.url.endsWith(`/${publicLocale}`));
}

async function getProductRoutes() {
  const [trProducts, enProducts] = await Promise.all([
    safeList<PublishedEntity>(() => getPublishedProducts('TR')),
    safeList<PublishedEntity>(() => getPublishedProducts('EN')),
  ]);

  return [
    ...localizedRoutes(trProducts, 'TR', (slug) => `/tr/products/${slug}`),
    ...localizedRoutes(enProducts, 'EN', (slug) => `/en/products/${slug}`),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trPages, enPages, trBlogPosts, enBlogPosts, trResources, enResources] =
    await Promise.all([
      safeList<PublishedEntity>(
        () => getPublishedPages('TR') as Promise<PublishedEntity[]>,
      ),
      safeList<PublishedEntity>(
        () => getPublishedPages('EN') as Promise<PublishedEntity[]>,
      ),
      safeList<PublishedEntity>(
        () => getPublishedBlogList('TR') as Promise<PublishedEntity[]>,
      ),
      safeList<PublishedEntity>(
        () => getPublishedBlogList('EN') as Promise<PublishedEntity[]>,
      ),
      safeList<PublishedEntity>(
        () => getPublishedResources('TR') as Promise<PublishedEntity[]>,
      ),
      safeList<PublishedEntity>(
        () => getPublishedResources('EN') as Promise<PublishedEntity[]>,
      ),
    ]);
  const productRoutes = await getProductRoutes();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: buildAbsoluteUrl('/tr'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/en'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/tr/products'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/en/products'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/tr/blog'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/en/blog'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/tr/resources'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/en/resources'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/tr/contact'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/en/contact'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/tr/demo-request'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/en/demo-request'), lastModified: new Date() },
  ];

  const trBlogRoutes = localizedRoutes(
    trBlogPosts,
    'TR',
    (slug) => `/tr/blog/${slug}`,
  );

  const enBlogRoutes = localizedRoutes(
    enBlogPosts,
    'EN',
    (slug) => `/en/blog/${slug}`,
  );

  const trResourceRoutes = localizedRoutes(
    trResources,
    'TR',
    (slug) => `/tr/resources/${slug}`,
  );

  const enResourceRoutes = localizedRoutes(
    enResources,
    'EN',
    (slug) => `/en/resources/${slug}`,
  );

  return [
    ...staticRoutes,
    ...genericPageRoutes(trPages, 'TR', 'tr'),
    ...genericPageRoutes(enPages, 'EN', 'en'),
    ...productRoutes,
    ...trBlogRoutes,
    ...enBlogRoutes,
    ...trResourceRoutes,
    ...enResourceRoutes,
  ];
}
