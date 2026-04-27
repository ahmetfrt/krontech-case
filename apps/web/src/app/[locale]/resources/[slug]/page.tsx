import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/json-ld';
import { getPublishedPage, type PublishedPage } from '@/lib/api';
import { normalizeApiLocale } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media';
import { getPublishedResource, type PublishedResource } from '@/lib/resources';
import {
  breadcrumbJsonLd,
  buildAbsoluteUrl,
  buildMetadata,
  webPageJsonLd,
} from '@/lib/seo';

type BlockRecord = Record<string, unknown>;

function asRecord(value: unknown): BlockRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as BlockRecord)
    : {};
}

function readString(record: BlockRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function readItems(record: BlockRecord, locale: 'en' | 'tr' = 'en') {
  const value = record.items;

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asRecord(item))
    .map((item) => ({
      title: readString(
        item,
        locale === 'tr'
          ? ['trTitle', 'title', 'name', 'question']
          : ['title', 'name', 'question'],
      ),
      text: readString(
        item,
        locale === 'tr'
          ? ['trText', 'text', 'summary', 'description', 'answer']
          : ['text', 'summary', 'description', 'answer'],
      ),
    }))
    .filter((item) => item.title || item.text);
}

function currentResourceTranslation(
  resource: PublishedResource,
  apiLocale: string,
) {
  return (
    resource.translations.find((translation) => translation.locale === apiLocale) ??
    resource.translations[0]
  );
}

function currentPageTranslation(page: PublishedPage, apiLocale: string) {
  return (
    page.translations?.find((translation) => translation.locale === apiLocale) ??
    page.translations?.[0]
  );
}

async function loadResource(locale: string, slug: string) {
  try {
    return (await getPublishedResource(locale, slug)) as PublishedResource;
  } catch {
    return undefined;
  }
}

async function loadResourceCategoryPage(locale: string, slug: string) {
  try {
    return (await getPublishedPage(locale, `resources/${slug}`)) as PublishedPage;
  } catch {
    return undefined;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const apiLocale = normalizeApiLocale(locale);
  const resource = await loadResource(apiLocale, slug);

  if (!resource) {
    const page = await loadResourceCategoryPage(apiLocale, slug);
    const current = page ? currentPageTranslation(page, apiLocale) : undefined;
    const trTranslation = page?.translations?.find(
      (translation) => translation.locale === 'TR',
    );
    const enTranslation = page?.translations?.find(
      (translation) => translation.locale === 'EN',
    );

    return buildMetadata({
      title: current?.seoTitle || current?.title || 'Resources',
      description:
        current?.seoDescription ||
        current?.summary ||
        'Krontech resources and security content.',
      canonicalPath: current?.canonicalUrl || `/${locale}/resources/${slug}`,
      alternatePaths: {
        ...(trTranslation ? { tr: `/tr/${trTranslation.slug}` } : {}),
        ...(enTranslation ? { en: `/en/${enTranslation.slug}` } : {}),
      },
      ogTitle: current?.ogTitle,
      ogDescription: current?.ogDescription,
      robotsIndex: current?.robotsIndex ?? true,
      robotsFollow: current?.robotsFollow ?? true,
    });
  }

  const current = currentResourceTranslation(resource, apiLocale);
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
  const resource = await loadResource(apiLocale, slug);

  if (!resource) {
    const page = await loadResourceCategoryPage(apiLocale, slug);
    const current = page ? currentPageTranslation(page, apiLocale) : undefined;

    if (!page || !current) {
      notFound();
    }

    const path = `/${locale}/resources/${slug}`;
    const jsonLd =
      current.structuredDataJson ||
      webPageJsonLd({
        name: current.title,
        description: current.summary || current.seoDescription || '',
        path,
        locale,
      });

    return (
      <main className="bg-white">
        <JsonLd data={jsonLd} />
        <JsonLd
          data={breadcrumbJsonLd([
            { name: locale === 'tr' ? 'Ana sayfa' : 'Home', path: `/${locale}` },
            {
              name: locale === 'tr' ? 'Kaynaklar' : 'Resources',
              path: `/${locale}/resources`,
            },
            { name: current.title, path },
          ])}
        />

        <section className="border-b border-slate-200 bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-300">
              {locale === 'tr' ? 'Kaynak Merkezi' : 'Resource Center'}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-normal sm:text-5xl">
              {current.title}
            </h1>
            {current.summary ? (
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
                {current.summary}
              </p>
            ) : null}
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-6">
            {(page.blocks ?? []).map((block, index) => {
              const config = asRecord(block.configJson);
              const title = readString(
                config,
                locale === 'tr'
                  ? ['trTitle', 'title', 'heading', 'name']
                  : ['title', 'heading', 'name'],
              );
              const text = readString(
                config,
                locale === 'tr'
                  ? ['trText', 'text', 'summary', 'description', 'body']
                  : ['text', 'summary', 'description', 'body'],
              );
              const ctaLabel = readString(config, ['ctaLabel', 'buttonLabel']);
              const ctaHref = readString(config, ['ctaHref', 'href', 'url']);
              const items = readItems(config, locale === 'tr' ? 'tr' : 'en');

              if (!title && !text && items.length === 0) {
                return null;
              }

              return (
                <article
                  key={block.id ?? `${block.type}-${index}`}
                  className="border-b border-slate-200 py-8 last:border-b-0"
                >
                  <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                        {block.type ?? `Section ${index + 1}`}
                      </div>
                      {title ? (
                        <h2 className="mt-3 text-2xl font-bold text-slate-950">
                          {title}
                        </h2>
                      ) : null}
                    </div>
                    <div className="space-y-5">
                      {text ? (
                        <p className="text-base leading-8 text-slate-700">
                          {text}
                        </p>
                      ) : null}
                      {items.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {items.map((item, itemIndex) => (
                            <div
                              key={`${item.title ?? 'item'}-${itemIndex}`}
                              className="rounded-md border border-slate-200 p-4"
                            >
                              {item.title ? (
                                <h3 className="font-semibold text-slate-950">
                                  {item.title}
                                </h3>
                              ) : null}
                              {item.text ? (
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {item.text}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {ctaLabel && ctaHref ? (
                        <Link
                          href={
                            ctaHref.startsWith('/') ? ctaHref : `/${locale}/${ctaHref}`
                          }
                          className="inline-flex rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
                        >
                          {ctaLabel}
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

  const current = currentResourceTranslation(resource, apiLocale);
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
