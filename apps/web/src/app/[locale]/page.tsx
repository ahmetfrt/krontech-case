import { getPublishedPage } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { normalizeApiLocale } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const apiLocale = normalizeApiLocale(locale);
  const slug = locale === 'tr' ? 'ana-sayfa' : 'home-page';

  const page = await getPublishedPage(apiLocale, slug);
  const current = page.translations.find((t: any) => t.locale === apiLocale);

  return buildMetadata({
    title: current?.seoTitle || current?.title || 'Home',
    description:
      current?.seoDescription || current?.summary || 'Krontech homepage',
    canonicalPath: `/${locale}`,
    alternatePaths: {
      tr: '/tr',
      en: '/en',
    },
  });
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const apiLocale = normalizeApiLocale(locale);
  const slug = locale === 'tr' ? 'ana-sayfa' : 'home-page';

  const page = await getPublishedPage(apiLocale, slug);
  const current = page.translations.find((t: any) => t.locale === apiLocale);

  return (
    <main className="p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{current?.title}</h1>
        <p className="text-lg text-gray-600">{current?.summary}</p>
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