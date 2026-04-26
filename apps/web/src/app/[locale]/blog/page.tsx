import Link from 'next/link';
import Image from 'next/image';
import { getPublishedBlogList } from '@/lib/blog';
import { normalizeApiLocale } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media';

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
