import type { MetadataRoute } from 'next';
import { getPublishedBlogList } from '@/lib/blog';
import { getPublishedResources } from '@/lib/resources';
import { getPublishedProduct } from '@/lib/products';
import { buildAbsoluteUrl } from '@/lib/seo';

async function getProductRoutes() {
  const locales = ['TR', 'EN'];
  const slugs = [
    { tr: 'kron-pam', en: 'kron-pam-en' },
  ];

  const routes: MetadataRoute.Sitemap = [];

  for (const item of slugs) {
    routes.push({
      url: buildAbsoluteUrl(`/tr/products/${item.tr}`),
      lastModified: new Date(),
    });
    routes.push({
      url: buildAbsoluteUrl(`/en/products/${item.en}`),
      lastModified: new Date(),
    });
  }

  return routes;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const trBlogPosts = await getPublishedBlogList('TR');
  const enBlogPosts = await getPublishedBlogList('EN');
  const trResources = await getPublishedResources('TR');
  const enResources = await getPublishedResources('EN');
  const productRoutes = await getProductRoutes();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: buildAbsoluteUrl('/tr'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/en'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/tr/blog'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/en/blog'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/tr/resources'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/en/resources'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/tr/contact'), lastModified: new Date() },
    { url: buildAbsoluteUrl('/en/contact'), lastModified: new Date() },
  ];

  const trBlogRoutes = trBlogPosts.map((post: any) => {
    const tr = post.translations.find((t: any) => t.locale === 'TR');

    return {
      url: buildAbsoluteUrl(`/tr/blog/${tr?.slug}`),
      lastModified: post.updatedAt || post.publishedAt || new Date(),
    };
  });

  const enBlogRoutes = enBlogPosts.map((post: any) => {
    const en = post.translations.find((t: any) => t.locale === 'EN');

    return {
      url: buildAbsoluteUrl(`/en/blog/${en?.slug}`),
      lastModified: post.updatedAt || post.publishedAt || new Date(),
    };
  });

  const trResourceRoutes = trResources.map((resource: any) => {
    const tr = resource.translations.find((t: any) => t.locale === 'TR');

    return {
      url: buildAbsoluteUrl(`/tr/resources#${tr?.slug}`),
      lastModified: resource.updatedAt || resource.publishedAt || new Date(),
    };
  });

  const enResourceRoutes = enResources.map((resource: any) => {
    const en = resource.translations.find((t: any) => t.locale === 'EN');

    return {
      url: buildAbsoluteUrl(`/en/resources#${en?.slug}`),
      lastModified: resource.updatedAt || resource.publishedAt || new Date(),
    };
  });

  return [
    ...staticRoutes,
    ...productRoutes,
    ...trBlogRoutes,
    ...enBlogRoutes,
    ...trResourceRoutes,
    ...enResourceRoutes,
  ];
}