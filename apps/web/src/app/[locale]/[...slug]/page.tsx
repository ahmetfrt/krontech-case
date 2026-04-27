import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/json-ld';
import { getPublishedPage, type PublishedPage } from '@/lib/api';
import { normalizeApiLocale } from '@/lib/i18n';
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  webPageJsonLd,
} from '@/lib/seo';

type PageProps = {
  params: Promise<{ locale: string; slug: string[] }>;
};

type BlockRecord = Record<string, unknown>;

function normalizeLocale(locale: string): 'en' | 'tr' {
  return locale === 'en' ? 'en' : 'tr';
}

function slugPath(slug: string[]) {
  return slug.join('/');
}

function currentTranslation(page: PublishedPage, apiLocale: string) {
  return (
    page.translations?.find((translation) => translation.locale === apiLocale) ??
    page.translations?.[0]
  );
}

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
      question: readString(
        item,
        locale === 'tr'
          ? ['trQuestion', 'question', 'title', 'name']
          : ['question', 'title', 'name'],
      ),
      answer: readString(
        item,
        locale === 'tr'
          ? ['trAnswer', 'answer', 'text', 'summary', 'description']
          : ['answer', 'text', 'summary', 'description'],
      ),
    }))
    .filter((item) => item.title || item.text);
}

async function loadPage(locale: string, slug: string[]) {
  const apiLocale = normalizeApiLocale(locale);

  try {
    return (await getPublishedPage(apiLocale, slugPath(slug))) as PublishedPage;
  } catch {
    return undefined;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  const activeLocale = normalizeLocale(locale);
  const apiLocale = normalizeApiLocale(locale);
  const page = await loadPage(locale, slug);
  const current = page ? currentTranslation(page, apiLocale) : undefined;
  const trTranslation = page?.translations?.find(
    (translation) => translation.locale === 'TR',
  );
  const enTranslation = page?.translations?.find(
    (translation) => translation.locale === 'EN',
  );
  const path = `/${activeLocale}/${slugPath(slug)}`;

  return buildMetadata({
    title: current?.seoTitle || current?.title || 'Krontech',
    description:
      current?.seoDescription ||
      current?.summary ||
      'Krontech enterprise access security content.',
    canonicalPath: current?.canonicalUrl || path,
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

export default async function CmsStandardPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const activeLocale = normalizeLocale(locale);
  const apiLocale = normalizeApiLocale(locale);
  const page = await loadPage(locale, slug);

  if (!page) {
    notFound();
  }

  const current = currentTranslation(page, apiLocale);

  if (!current) {
    notFound();
  }

  const path = `/${activeLocale}/${slugPath(slug)}`;
  const jsonLd =
    current.structuredDataJson ||
    webPageJsonLd({
      name: current.title,
      description: current.summary || current.seoDescription || '',
      path,
      locale: activeLocale,
    });
  const faqItems = (page.blocks ?? [])
    .filter((block) => block.type?.toLowerCase() === 'faq')
    .flatMap((block) => readItems(asRecord(block.configJson)))
    .reduce<{ answer: string; question: string }[]>((items, item) => {
      if (item.question && item.answer) {
        items.push({ answer: item.answer, question: item.question });
      }

      return items;
    }, []);

  return (
    <main className="bg-white">
      <JsonLd data={jsonLd} />
      {faqItems.length > 0 ? <JsonLd data={faqJsonLd(faqItems)} /> : null}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: activeLocale === 'tr' ? 'Ana sayfa' : 'Home', path: `/${activeLocale}` },
          { name: current.title, path },
        ])}
      />

      <section className="border-b border-slate-200 bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-300">
            Krontech
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
              activeLocale === 'tr'
                ? ['trTitle', 'title', 'heading', 'name']
                : ['title', 'heading', 'name'],
            );
            const text = readString(
              config,
              activeLocale === 'tr'
                ? ['trText', 'text', 'summary', 'description', 'body']
                : ['text', 'summary', 'description', 'body'],
            );
            const ctaLabel = readString(config, ['ctaLabel', 'buttonLabel']);
            const ctaHref = readString(config, ['ctaHref', 'href', 'url']);
            const items = readItems(config, activeLocale);

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
                        href={ctaHref.startsWith('/') ? ctaHref : `/${activeLocale}/${ctaHref}`}
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
