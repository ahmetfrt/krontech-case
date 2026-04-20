import Link from 'next/link';
import { getPublishedBlogList } from '@/lib/blog';

export default async function BlogListPage() {
  const posts = await getPublishedBlogList('TR');

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Blog</h1>

      <div className="space-y-4">
        {posts.map((post: any) => {
          const tr = post.translations.find((t: any) => t.locale === 'TR');

          return (
            <article key={post.id} className="rounded-xl border p-4">
              <h2 className="text-xl font-semibold">{tr?.title}</h2>
              <p className="text-gray-600">{tr?.excerpt}</p>
              <Link
                href={`/blog/${tr?.slug}`}
                className="mt-2 inline-block text-blue-600 underline"
              >
                Devamını oku
              </Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}