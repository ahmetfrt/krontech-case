import { getPublishedBlogPost, type PublishedBlogPost } from '@/lib/blog';
import { JsonLd } from '@/components/seo/json-ld';
import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildAbsoluteUrl,
  buildMetadata,
} from '@/lib/seo';
import { normalizeApiLocale } from '@/lib/i18n';
import Image from 'next/image';
import { resolveMediaUrl } from '@/lib/media';


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const apiLocale = normalizeApiLocale(locale);

  const post = (await getPublishedBlogPost(apiLocale, slug)) as PublishedBlogPost;
  const current = post.translations.find((t) => t.locale === apiLocale);

  const trTranslation = post.translations.find((t) => t.locale === 'TR');
  const enTranslation = post.translations.find((t) => t.locale === 'EN');

  return buildMetadata({
    title: current?.seoTitle || current?.title || 'Blog',
    description:
      current?.seoDescription || current?.excerpt || 'Blog detail',
    canonicalPath: current?.canonicalUrl || `/${locale}/blog/${slug}`,
    alternatePaths: {
      ...(trTranslation ? { tr: `/tr/blog/${trTranslation.slug}` } : {}),
      ...(enTranslation ? { en: `/en/blog/${enTranslation.slug}` } : {}),
    },
    ogTitle: current?.ogTitle,
    ogDescription: current?.ogDescription,
    robotsIndex: current?.robotsIndex ?? true,
    robotsFollow: current?.robotsFollow ?? true,
  });
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const apiLocale = normalizeApiLocale(locale);

  const post = (await getPublishedBlogPost(apiLocale, slug)) as PublishedBlogPost;
  const current = post.translations.find((t) => t.locale === apiLocale);
  const featuredUrl = resolveMediaUrl(post.featuredImage?.publicUrl);

  const jsonLd =
    current?.structuredDataJson ||
    articleJsonLd({
      headline: current?.title || '',
      description: current?.excerpt || '',
      url: buildAbsoluteUrl(`/${locale}/blog/${slug}`),
      authorName: post.authorName ?? undefined,
      image: featuredUrl || undefined,
    });

  return (
    <main className="p-8 space-y-6">
      <JsonLd data={jsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: locale === 'tr' ? 'Ana sayfa' : 'Home', path: `/${locale}` },
          { name: 'Blog', path: `/${locale}/blog` },
          {
            name: current?.title || 'Blog',
            path: `/${locale}/blog/${slug}`,
          },
        ])}
      />

      <article>
        {featuredUrl ? (
          <div className="mb-8 overflow-hidden rounded-lg border border-gray-200">
            <Image
              src={featuredUrl}
              alt={current?.title || 'Blog image'}
              width={1200}
              height={700}
              className="h-auto w-full object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
          </div>
        ) : null}

        <header className="space-y-2">
          <h1 className="text-3xl font-bold">{current?.title}</h1>
          <p className="text-sm text-gray-500">
            {locale === 'tr' ? 'Yazar' : 'Author'}: {post.authorName ?? 'N/A'}
          </p>
          <p className="text-lg text-gray-600">{current?.excerpt}</p>
        </header>

        <section className="prose max-w-none mt-6">
          <p>{current?.content}</p>
        </section>
      </article>
    </main>
  );
}
