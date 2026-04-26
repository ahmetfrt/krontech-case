import Link from 'next/link';
import Image from 'next/image';
import { JsonLd } from '@/components/seo/json-ld';
import { getPublishedBlogList } from '@/lib/blog';
import { normalizeApiLocale } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media';
import {
  breadcrumbJsonLd,
  buildAbsoluteUrl,
  buildMetadata,
  collectionPageJsonLd,
} from '@/lib/seo';

type BlogTranslation = {
  excerpt?: string | null;
  locale: string;
  slug?: string | null;
  title?: string | null;
};

type BlogListItem = {
  featuredImage?: {
    publicUrl?: string | null;
  } | null;
  id: string;
  translations: BlogTranslation[];
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return buildMetadata({
    title: 'Blog',
    description:
      locale === 'tr'
        ? 'Krontech guvenlik, erisim yonetimi ve uyumluluk yazilari'
        : 'Krontech articles about security, access management and compliance',
    canonicalPath: `/${locale}/blog`,
    alternatePaths: {
      tr: '/tr/blog',
      en: '/en/blog',
    },
  });
}

export default async function BlogListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const apiLocale = normalizeApiLocale(locale);

  const posts = (await getPublishedBlogList(apiLocale)) as BlogListItem[];
  const pageDescription =
    locale === 'tr'
      ? 'Krontech guvenlik, erisim yonetimi ve uyumluluk yazilari'
      : 'Krontech articles about security, access management and compliance';
  const itemList = posts
    .map((post) => {
      const current = post.translations.find(
        (translation) => translation.locale === apiLocale,
      );

      if (!current?.slug || !current.title) return undefined;

      return {
        name: current.title,
        url: buildAbsoluteUrl(`/${locale}/blog/${current.slug}`),
      };
    })
    .filter((item): item is { name: string; url: string } => Boolean(item));

  return (
    <main className="p-8 space-y-6">
      <JsonLd
        data={collectionPageJsonLd({
          name: 'Blog',
          description: pageDescription,
          path: `/${locale}/blog`,
          locale,
          items: itemList,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: locale === 'tr' ? 'Ana sayfa' : 'Home', path: `/${locale}` },
          { name: 'Blog', path: `/${locale}/blog` },
        ])}
      />

      <h1 className="text-3xl font-bold">
        {locale === 'tr' ? 'Blog' : 'Blog'}
      </h1>

      <div className="space-y-4">
        {posts.map((post) => {
          const current = post.translations.find(
            (translation) => translation.locale === apiLocale,
          );
          const imageUrl = resolveMediaUrl(post.featuredImage?.publicUrl);

          return (
            <article
              key={post.id}
              className="grid overflow-hidden rounded-lg border border-gray-200 bg-white md:grid-cols-[280px_1fr]"
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={current?.title || 'Blog image'}
                  width={560}
                  height={360}
                  className="h-full min-h-56 w-full object-cover"
                  sizes="(max-width: 768px) 100vw, 280px"
                />
              ) : null}
              <div className="p-5">
                <h2 className="text-xl font-semibold">{current?.title}</h2>
                <p className="mt-2 text-gray-600">{current?.excerpt}</p>
                <Link
                  href={`/${locale}/blog/${current?.slug}`}
                  className="mt-4 inline-block text-blue-600 underline"
                >
                  {locale === 'tr' ? 'Devamını oku' : 'Read more'}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
