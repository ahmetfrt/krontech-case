import { getPublishedBlogPost } from '@/lib/blog';
import { articleJsonLd, buildAbsoluteUrl, buildMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedBlogPost('TR', slug);
  const tr = post.translations.find((t: any) => t.locale === 'TR');

  return buildMetadata({
    title: tr?.seoTitle || tr?.title || 'Blog',
    description: tr?.seoDescription || tr?.excerpt || 'Blog detail',
    path: `/blog/${slug}`,
  });
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedBlogPost('TR', slug);
  const tr = post.translations.find((t: any) => t.locale === 'TR');

  const jsonLd = articleJsonLd({
    headline: tr?.title || '',
    description: tr?.excerpt || '',
    url: buildAbsoluteUrl(`/blog/${slug}`),
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
          <h1 className="text-3xl font-bold">{tr?.title}</h1>
          <p className="text-sm text-gray-500">
            Yazar: {post.authorName ?? 'N/A'}
          </p>
          <p className="text-lg text-gray-600">{tr?.excerpt}</p>
        </header>

        <section className="prose max-w-none mt-6">
          <p>{tr?.content}</p>
        </section>
      </article>
    </main>
  );
}