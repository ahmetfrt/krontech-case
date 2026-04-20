import type { MetadataRoute } from 'next';
import { getPublishedBlogList } from '@/lib/blog';
import { getPublishedResources } from '@/lib/resources';
import { buildAbsoluteUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await getPublishedBlogList('TR');
  const resources = await getPublishedResources('TR');

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: buildAbsoluteUrl('/'),
      lastModified: new Date(),
    },
    {
      url: buildAbsoluteUrl('/blog'),
      lastModified: new Date(),
    },
    {
      url: buildAbsoluteUrl('/resources'),
      lastModified: new Date(),
    },
    {
      url: buildAbsoluteUrl('/contact'),
      lastModified: new Date(),
    },
  ];

  const blogRoutes = blogPosts.map((post: any) => {
    const tr = post.translations.find((t: any) => t.locale === 'TR');

    return {
      url: buildAbsoluteUrl(`/blog/${tr?.slug}`),
      lastModified: post.updatedAt || post.publishedAt || new Date(),
    };
  });

  const resourceRoutes = resources.map((resource: any) => {
    const tr = resource.translations.find((t: any) => t.locale === 'TR');

    return {
      url: buildAbsoluteUrl(`/resources#${tr?.slug}`),
      lastModified: resource.updatedAt || resource.publishedAt || new Date(),
    };
  });

  return [...staticRoutes, ...blogRoutes, ...resourceRoutes];
}