import type { MetadataRoute } from 'next';
import { getPublishedBlogList } from '@/lib/blog';
import { getPublishedResources } from '@/lib/resources';
import { getPublishedProducts } from '@/lib/products';
import { buildAbsoluteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type TranslationRoute = {
  locale: string;
  slug?: string | null;
};

type PublishedEntity = {
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
  const [trBlogPosts, enBlogPosts, trResources, enResources] =
    await Promise.all([
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
    (slug) => `/tr/resources#${slug}`,
  );

  const enResourceRoutes = localizedRoutes(
    enResources,
    'EN',
    (slug) => `/en/resources#${slug}`,
  );

  return [
    ...staticRoutes,
    ...productRoutes,
    ...trBlogRoutes,
    ...enBlogRoutes,
    ...trResourceRoutes,
    ...enResourceRoutes,
  ];
}
