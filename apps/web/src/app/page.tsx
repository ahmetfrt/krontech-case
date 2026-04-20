import { getPublishedPage } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const page = await getPublishedPage('TR', 'ana-sayfa');
  const tr = page.translations.find((t: any) => t.locale === 'TR');

  return buildMetadata({
    title: tr?.seoTitle || tr?.title || 'Ana Sayfa',
    description: tr?.seoDescription || tr?.summary || 'Krontech ana sayfa',
    path: '/',
  });
}

export default async function HomePage() {
  const page = await getPublishedPage('TR', 'ana-sayfa');
  const tr = page.translations.find((t: any) => t.locale === 'TR');

  return (
    <main className="p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{tr?.title}</h1>
        <p className="text-lg text-gray-600">{tr?.summary}</p>
      </header>

      <section className="space-y-4">
        {page.blocks.map((block: any) => (
          <article key={block.id} className="border rounded-xl p-4">
            <div className="text-sm text-gray-500">{block.type}</div>
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(block.configJson, null, 2)}
            </pre>
          </article>
        ))}
      </section>
    </main>
  );
}