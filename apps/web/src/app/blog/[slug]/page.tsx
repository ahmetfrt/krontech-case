import { getPublishedBlogPost } from '@/lib/blog';

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedBlogPost('TR', slug);

  const tr = post.translations.find((t: any) => t.locale === 'TR');

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">{tr?.title}</h1>
      <p className="text-sm text-gray-500">Yazar: {post.authorName ?? 'N/A'}</p>
      <p className="text-lg text-gray-600">{tr?.excerpt}</p>
      <article className="prose max-w-none">
        <p>{tr?.content}</p>
      </article>
    </main>
  );
}