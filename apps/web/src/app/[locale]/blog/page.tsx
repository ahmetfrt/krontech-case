import Link from 'next/link';
import Image from 'next/image';
import { JsonLd } from '@/components/seo/json-ld';
import { getPublishedBlogList } from '@/lib/blog';
import { normalizeApiLocale } from '@/lib/i18n';
import { blogFallbackImage, resolveMediaUrl } from '@/lib/media';
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

async function getPostsSafely(locale: string): Promise<BlogListItem[]> {
  try {
    return (await getPublishedBlogList(locale)) as BlogListItem[];
  } catch {
    return [];
  }
}

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

  const posts = await getPostsSafely(apiLocale);
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
    <main className="bg-white px-4 py-12 sm:px-6 lg:px-8">
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

      <div className="mx-auto max-w-7xl">
        <header className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            {locale === 'tr' ? 'Icerikler' : 'Insights'}
          </p>
          <h1 className="mt-4 text-4xl font-bold text-slate-950">Blog</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            {pageDescription}
          </p>
        </header>

        <div className="mt-10 space-y-4">
          {posts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-slate-600">
              {locale === 'tr'
                ? 'Yayinda blog yazisi bulunamadi.'
                : 'No published blog posts yet.'}
            </div>
          ) : null}

          {posts.map((post) => {
            const current = post.translations.find(
              (translation) => translation.locale === apiLocale,
            );
            const imageUrl =
              resolveMediaUrl(post.featuredImage?.publicUrl) ||
              blogFallbackImage();

            return (
              <article
                key={post.id}
                className="grid overflow-hidden rounded-lg border border-gray-200 bg-white md:grid-cols-[280px_1fr]"
              >
                <Image
                  src={imageUrl}
                  alt={current?.title || 'Blog image'}
                  width={560}
                  height={360}
                  className="h-full min-h-56 w-full object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 280px"
                />
                <div className="p-5">
                  <h2 className="text-xl font-semibold">{current?.title}</h2>
                  <p className="mt-2 text-gray-600">{current?.excerpt}</p>
                  <Link
                    href={`/${locale}/blog/${current?.slug}`}
                    className="mt-4 inline-block text-blue-600 underline"
                  >
                    {locale === 'tr' ? 'Devamini oku' : 'Read more'}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
