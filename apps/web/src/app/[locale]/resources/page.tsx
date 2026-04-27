import { JsonLd } from '@/components/seo/json-ld';
import Link from 'next/link';
import Image from 'next/image';
import { getPublishedResources } from '@/lib/resources';
import { normalizeApiLocale } from '@/lib/i18n';
import { resourceFallbackImage, resolveMediaUrl } from '@/lib/media';
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
    <main className="bg-white">
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

      <section className="border-b border-slate-200 bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-300">
              {locale === 'tr' ? 'Kaynak Merkezi' : 'Resource Center'}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-normal sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              {description}
            </p>
          </div>
          <picture className="overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
            <source
              srcSet="/images/kron-resource-library.avif"
              type="image/avif"
            />
            <source
              srcSet="/images/kron-resource-library.webp"
              type="image/webp"
            />
            <Image
              src="/images/kron-resource-library.webp"
              alt={
                locale === 'tr'
                  ? 'Krontech siber guvenlik kaynak kutuphanesi gorseli'
                  : 'Krontech cybersecurity resource library visual'
              }
              width={1600}
              height={1000}
              className="h-full min-h-[280px] w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 48vw"
            />
          </picture>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
          {resources.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-slate-600 md:col-span-2">
              {locale === 'tr'
                ? 'Yayinda kaynak bulunamadi.'
                : 'No published resources yet.'}
            </div>
          ) : null}

          {resources.map((resource) => {
            const current = resource.translations.find(
              (translation) => translation.locale === apiLocale,
            );
            const fileUrl = resolveMediaUrl(resource.file?.publicUrl);

            return (
              <article
                key={resource.id}
                id={current?.slug ?? resource.id}
                className="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:grid-cols-[180px_1fr]"
              >
                <Image
                  src={resourceFallbackImage()}
                  alt=""
                  width={480}
                  height={360}
                  className="h-full min-h-44 w-full object-cover"
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, 180px"
                />
                <div className="p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                    {resource.resourceType}
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-slate-950">
                    {current?.title}
                  </h2>
                  <p className="mt-2 text-slate-600">{current?.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {fileUrl ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-sm font-bold text-red-700 underline-offset-4 hover:underline"
                      >
                        {locale === 'tr' ? 'Dosyayi indir' : 'Download file'}
                      </a>
                    ) : null}
                    {resource.externalUrl ? (
                      <a
                        href={resource.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-sm font-bold text-red-700 underline-offset-4 hover:underline"
                      >
                        {locale === 'tr' ? 'Kaynagi ac' : 'Open resource'}
                      </a>
                    ) : null}
                    {current?.slug ? (
                      <Link
                        href={`/${locale}/resources/${current.slug}`}
                        className="inline-flex text-sm font-bold text-red-700 underline-offset-4 hover:underline"
                      >
                        {locale === 'tr' ? 'Detaylari incele' : 'View details'}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
