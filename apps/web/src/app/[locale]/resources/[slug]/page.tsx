import { JsonLd } from '@/components/seo/json-ld';
import { normalizeApiLocale } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media';
import { getPublishedResource, type PublishedResource } from '@/lib/resources';
import {
  breadcrumbJsonLd,
  buildAbsoluteUrl,
  buildMetadata,
  webPageJsonLd,
} from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const apiLocale = normalizeApiLocale(locale);
  const resource = (await getPublishedResource(
    apiLocale,
    slug,
  )) as PublishedResource;
  const current = resource.translations.find(
    (translation) => translation.locale === apiLocale,
  );
  const trTranslation = resource.translations.find(
    (translation) => translation.locale === 'TR',
  );
  const enTranslation = resource.translations.find(
    (translation) => translation.locale === 'EN',
  );

  return buildMetadata({
    title: current?.seoTitle || current?.title || 'Resource',
    description:
      current?.seoDescription || current?.summary || 'Resource detail',
    canonicalPath: current?.canonicalUrl || `/${locale}/resources/${slug}`,
    alternatePaths: {
      ...(trTranslation ? { tr: `/tr/resources/${trTranslation.slug}` } : {}),
      ...(enTranslation ? { en: `/en/resources/${enTranslation.slug}` } : {}),
    },
    ogTitle: current?.ogTitle,
    ogDescription: current?.ogDescription,
    robotsIndex: current?.robotsIndex ?? true,
    robotsFollow: current?.robotsFollow ?? true,
  });
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const apiLocale = normalizeApiLocale(locale);
  const resource = (await getPublishedResource(
    apiLocale,
    slug,
  )) as PublishedResource;
  const current = resource.translations.find(
    (translation) => translation.locale === apiLocale,
  );
  const fileUrl = resolveMediaUrl(resource.file?.publicUrl);
  const defaultJsonLd = webPageJsonLd({
    name: current?.title || 'Resource',
    description: current?.summary || '',
    path: `/${locale}/resources/${slug}`,
    locale,
  });

  return (
    <main className="space-y-6 p-8">
      <JsonLd data={current?.structuredDataJson || defaultJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: locale === 'tr' ? 'Ana sayfa' : 'Home', path: `/${locale}` },
          {
            name: locale === 'tr' ? 'Kaynaklar' : 'Resources',
            path: `/${locale}/resources`,
          },
          {
            name: current?.title || 'Resource',
            path: `/${locale}/resources/${slug}`,
          },
        ])}
      />

      <article className="max-w-3xl space-y-4">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
          {resource.resourceType}
        </div>
        <h1 className="text-3xl font-bold">{current?.title}</h1>
        <p className="text-lg text-gray-600">{current?.summary}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-black px-5 py-3 text-sm font-bold text-white"
            >
              {locale === 'tr' ? 'Dosyayı indir' : 'Download file'}
            </a>
          ) : null}
          {resource.externalUrl ? (
            <a
              href={resource.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-gray-300 px-5 py-3 text-sm font-bold text-gray-900"
            >
              {locale === 'tr' ? 'Kaynağı aç' : 'Open resource'}
            </a>
          ) : null}
        </div>
        <p className="text-sm text-gray-500">
          {buildAbsoluteUrl(`/${locale}/resources/${slug}`)}
        </p>
      </article>
    </main>
  );
}
