import Link from 'next/link';
import { getPublishedBlogList } from '@/lib/blog';
import { normalizeApiLocale } from '@/lib/i18n';

export default async function BlogListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const apiLocale = normalizeApiLocale(locale);

  const posts = await getPublishedBlogList(apiLocale);

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">
        {locale === 'tr' ? 'Blog' : 'Blog'}
      </h1>

      <div className="space-y-4">
        {posts.map((post: any) => {
          const current = post.translations.find(
            (t: any) => t.locale === apiLocale,
          );

          return (
            <article key={post.id} className="rounded-xl border p-4">
              <h2 className="text-xl font-semibold">{current?.title}</h2>
              <p className="text-gray-600">{current?.excerpt}</p>
              <Link
                href={`/${locale}/blog/${current?.slug}`}
                className="mt-2 inline-block text-blue-600 underline"
              >
                {locale === 'tr' ? 'Devamını oku' : 'Read more'}
              </Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}