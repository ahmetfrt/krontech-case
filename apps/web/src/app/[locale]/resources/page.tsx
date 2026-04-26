import { buildMetadata } from '@/lib/seo';
import { getPublishedResources } from '@/lib/resources';
import { normalizeApiLocale } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return buildMetadata({
    title: locale === 'tr' ? 'Kaynaklar' : 'Resources',
    description:
      locale === 'tr'
        ? 'Krontech kaynakları ve içerikleri'
        : 'Krontech resources and content',
    canonicalPath: `/${locale}/resources`,
    alternatePaths: {
      tr: '/tr/resources',
      en: '/en/resources',
    },
  });
}

export default async function ResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const apiLocale = normalizeApiLocale(locale);

  const resources = await getPublishedResources(apiLocale);

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">
        {locale === 'tr' ? 'Kaynaklar' : 'Resources'}
      </h1>

      <div className="space-y-4">
        {resources.map((resource: any) => {
          const current = resource.translations.find(
            (t: any) => t.locale === apiLocale,
          );
          const fileUrl = resolveMediaUrl(resource.file?.publicUrl);

          return (
            <article key={resource.id} className="rounded-xl border p-4">
              <div className="text-sm text-gray-500">{resource.resourceType}</div>
              <h2 className="text-xl font-semibold">{current?.title}</h2>
              <p className="text-gray-600">{current?.summary}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {fileUrl ? (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-blue-600 underline"
                  >
                    {locale === 'tr' ? 'Dosyayı indir' : 'Download file'}
                  </a>
                ) : null}
                {resource.externalUrl ? (
                <a
                  href={resource.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-blue-600 underline"
                >
                  {locale === 'tr' ? 'Kaynağı aç' : 'Open resource'}
                </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
