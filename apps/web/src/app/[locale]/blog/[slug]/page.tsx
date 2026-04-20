import { getPublishedBlogPost } from '@/lib/blog';
import {
  articleJsonLd,
  buildAbsoluteUrl,
  buildMetadata,
} from '@/lib/seo';
import { normalizeApiLocale } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const apiLocale = normalizeApiLocale(locale);

  const post = await getPublishedBlogPost(apiLocale, slug);
  const current = post.translations.find((t: any) => t.locale === apiLocale);

  const trTranslation = post.translations.find((t: any) => t.locale === 'TR');
  const enTranslation = post.translations.find((t: any) => t.locale === 'EN');

  return buildMetadata({
    title: current?.seoTitle || current?.title || 'Blog',
    description:
      current?.seoDescription || current?.excerpt || 'Blog detail',
    canonicalPath: `/${locale}/blog/${slug}`,
    alternatePaths: {
      ...(trTranslation ? { tr: `/tr/blog/${trTranslation.slug}` } : {}),
      ...(enTranslation ? { en: `/en/blog/${enTranslation.slug}` } : {}),
    },
  });
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const apiLocale = normalizeApiLocale(locale);

  const post = await getPublishedBlogPost(apiLocale, slug);
  const current = post.translations.find((t: any) => t.locale === apiLocale);

  const jsonLd = articleJsonLd({
    headline: current?.title || '',
    description: current?.excerpt || '',
    url: buildAbsoluteUrl(`/${locale}/blog/${slug}`),
    authorName: post.authorName,
  });

  return (
    <main className="p-8 space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
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