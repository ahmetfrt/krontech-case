import { JsonLd } from '@/components/seo/json-ld';
import Link from 'next/link';
import { getPublishedResources } from '@/lib/resources';
import { normalizeApiLocale } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media';
import {
  breadcrumbJsonLd,
  buildAbsoluteUrl,
  buildMetadata,
  collectionPageJsonLd,
} from '@/lib/seo';

type ResourceTranslation = {
  locale: string;
  slug?: string | null;
  summary?: string | null;
  title?: string | null;
};

type ResourceListItem = {
  externalUrl?: string | null;
  file?: {
    publicUrl?: string | null;
  } | null;
  id: string;
  resourceType: string;
  translations: ResourceTranslation[];
};

async function getResourcesSafely(locale: string): Promise<ResourceListItem[]> {
  try {
    return (await getPublishedResources(locale)) as ResourceListItem[];
  } catch {
    return [];
  }
}

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

  const resources = await getResourcesSafely(apiLocale);
  const title = locale === 'tr' ? 'Kaynaklar' : 'Resources';
  const description =
    locale === 'tr'
      ? 'Krontech kaynakları ve içerikleri'
      : 'Krontech resources and content';
  const itemList = resources
    .map((resource) => {
      const current = resource.translations.find(
        (translation) => translation.locale === apiLocale,
      );

      if (!current?.slug || !current.title) return undefined;

      return {
        name: current.title,
        url: buildAbsoluteUrl(`/${locale}/resources/${current.slug}`),
      };
    })
    .filter((item): item is { name: string; url: string } => Boolean(item));

  return (
    <main className="p-8 space-y-6">
      <JsonLd
        data={collectionPageJsonLd({
          name: title,
          description,
          path: `/${locale}/resources`,
          locale,
          items: itemList,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: locale === 'tr' ? 'Ana sayfa' : 'Home', path: `/${locale}` },
          { name: title, path: `/${locale}/resources` },
        ])}
      />

      <h1 className="text-3xl font-bold">{title}</h1>

      <div className="space-y-4">
        {resources.map((resource) => {
          const current = resource.translations.find(
            (translation) => translation.locale === apiLocale,
          );
          const fileUrl = resolveMediaUrl(resource.file?.publicUrl);

          return (
            <article
              key={resource.id}
              id={current?.slug ?? resource.id}
              className="rounded-xl border p-4"
            >
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
                {current?.slug ? (
                  <Link
                    href={`/${locale}/resources/${current.slug}`}
                    className="inline-block text-blue-600 underline"
                  >
                    {locale === 'tr' ? 'Detayları incele' : 'View details'}
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
