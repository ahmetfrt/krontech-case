import { getPublishedPage } from '@/lib/api';

export default async function HomePage() {
  const page = await getPublishedPage('TR', 'ana-sayfa');

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">
        {page.translations.find((t: any) => t.locale === 'TR')?.title}
      </h1>

      <p className="text-lg text-gray-600">
        {page.translations.find((t: any) => t.locale === 'TR')?.summary}
      </p>

      <section className="space-y-4">
        {page.blocks.map((block: any) => (
          <div key={block.id} className="border rounded-xl p-4">
            <div className="text-sm text-gray-500">{block.type}</div>
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(block.configJson, null, 2)}
            </pre>
          </div>
        ))}
      </section>
    </main>
  );
}