import Link from 'next/link';
import Image from 'next/image';
import { JsonLd } from '@/components/seo/json-ld';
import { getPublishedPage } from '@/lib/api';
import {
  buildMetadata,
  organizationJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} from '@/lib/seo';
import { normalizeApiLocale } from '@/lib/i18n';

type PageTranslation = {
  locale: string;
  metaDescription?: string | null;
  seoDescription?: string | null;
  seoTitle?: string | null;
  summary?: string | null;
  title?: string | null;
};

type PageBlock = {
  id?: string;
  type?: string | null;
  configJson?: unknown;
};

type PublishedPage = {
  blocks?: PageBlock[];
  translations?: PageTranslation[];
};

type FeatureCard = {
  accent: string;
  text: string;
  title: string;
};

const fallbackContent = {
  en: {
    title: 'Secure access for modern enterprises',
    summary:
      'Protect privileged accounts, govern critical sessions, and keep remote operations visible from one resilient security platform.',
    eyebrow: 'Privileged Access Security',
    primaryCta: 'Explore products',
    secondaryCta: 'Talk to an expert',
    productsTitle: 'Built for critical access paths',
    productsSummary:
      'A focused experience for teams that need control, visibility, and auditability without slowing operations down.',
    cmsTitle: 'Managed content, rendered cleanly',
    cmsSummary:
      'Homepage blocks from the CMS now become readable sections instead of raw configuration output.',
    operations: 'Live access operations',
  },
  tr: {
    title: 'Modern kurumlar icin guvenli erisim',
    summary:
      'Yetkili hesaplari koruyun, kritik oturumlari yonetin ve uzaktan operasyonlari tek guvenli platformdan izleyin.',
    eyebrow: 'Yetkili Erisim Guvenligi',
    primaryCta: 'Urunleri incele',
    secondaryCta: 'Uzmanla gorus',
    productsTitle: 'Kritik erisim yollarina odakli',
    productsSummary:
      'Operasyonlari yavaslatmadan kontrol, gorunurluk ve denetlenebilirlik isteyen ekipler icin tasarlandi.',
    cmsTitle: 'CMS icerigi temiz sekilde yayinda',
    cmsSummary:
      'Anasayfa bloklari artik ham konfigurasyon yerine okunabilir bolumlere donusuyor.',
    operations: 'Canli erisim operasyonlari',
  },
} as const;

const productCards: Record<'en' | 'tr', FeatureCard[]> = {
  en: [
    {
      title: 'Privileged Access Management',
      text: 'Centralize privileged accounts, approvals, and session policies for high-risk systems.',
      accent: 'PAM',
    },
    {
      title: 'Secure Remote Access',
      text: 'Give operators controlled access to sensitive environments without exposing the network.',
      accent: 'SRA',
    },
    {
      title: 'Audit & Compliance',
      text: 'Turn access activity into searchable evidence for security reviews and compliance teams.',
      accent: 'GRC',
    },
  ],
  tr: [
    {
      title: 'Yetkili Erisim Yonetimi',
      text: 'Kritik sistemler icin yetkili hesaplari, onaylari ve oturum politikalarini merkezilestirin.',
      accent: 'PAM',
    },
    {
      title: 'Guvenli Uzaktan Erisim',
      text: 'Operatorlere hassas ortamlara agi aciga cikarmadan kontrollu erisim verin.',
      accent: 'SRA',
    },
    {
      title: 'Denetim ve Uyumluluk',
      text: 'Erisim hareketlerini guvenlik ve uyumluluk ekipleri icin aranabilir kanita donusturun.',
      accent: 'GRC',
    },
  ],
};

const defaultHighlights: Record<'en' | 'tr', FeatureCard[]> = {
  en: [
    {
      title: 'Policy-first publishing',
      text: 'Content, products, and resources can be managed without changing the public rendering layer.',
      accent: 'CMS',
    },
    {
      title: 'International-ready structure',
      text: 'Locale-aware routes and translated metadata keep the site ready for Turkish and English pages.',
      accent: 'i18n',
    },
    {
      title: 'Operational handoff',
      text: 'Admin and API foundations are in place for editorial workflows and future approval states.',
      accent: 'Ops',
    },
  ],
  tr: [
    {
      title: 'Politika odakli yayinlama',
      text: 'Icerik, urun ve kaynaklar public render katmani degismeden yonetilebilir.',
      accent: 'CMS',
    },
    {
      title: 'Cok dilli hazir yapi',
      text: 'Locale destekli rotalar ve cevrilmis metadata, Turkce ve Ingilizce sayfalari hazir tutar.',
      accent: 'i18n',
    },
    {
      title: 'Operasyon devri',
      text: 'Admin ve API temelleri editor akislari ve gelecek onay durumlari icin hazir.',
      accent: 'Ops',
    },
  ],
};

function normalizeLocale(locale: string): 'en' | 'tr' {
  return locale === 'en' ? 'en' : 'tr';
}

function homeSlug(locale: string) {
  return locale === 'tr' ? 'ana-sayfa' : 'home-page';
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function blockCards(
  blocks: PageBlock[] | undefined,
  locale: 'en' | 'tr',
): FeatureCard[] {
  const cards = (blocks ?? [])
    .map((block, index) => {
      const config = asRecord(block.configJson);
      const title = readString(config, ['title', 'heading', 'name']);
      const text = readString(config, [
        'summary',
        'description',
        'text',
        'body',
      ]);

      if (!title && !text) {
        return undefined;
      }

      return {
        title: title ?? (locale === 'tr' ? 'Icerik blogu' : 'Content block'),
        text:
          text ??
          (locale === 'tr'
            ? 'CMS tarafindan yonetilen yayin blogu.'
            : 'Managed CMS publishing block.'),
        accent:
          readString(config, ['label', 'eyebrow', 'type']) ??
          block.type ??
          `0${index + 1}`,
      };
    })
    .filter((card): card is FeatureCard => Boolean(card));

  return cards.length > 0 ? cards.slice(0, 3) : defaultHighlights[locale];
}

async function getHomeContent(locale: string) {
  const activeLocale = normalizeLocale(locale);
  const apiLocale = normalizeApiLocale(locale);
  const fallbackPage: PublishedPage = {
    blocks: [],
    translations: [
      {
        locale: apiLocale,
        metaDescription: fallbackContent[activeLocale].summary,
        seoDescription: fallbackContent[activeLocale].summary,
        seoTitle: fallbackContent[activeLocale].title,
        summary: fallbackContent[activeLocale].summary,
        title: fallbackContent[activeLocale].title,
      },
    ],
  };

  try {
    const page = (await getPublishedPage(
      apiLocale,
      homeSlug(activeLocale),
    )) as PublishedPage;
    const current =
      page.translations?.find((translation) => translation.locale === apiLocale) ??
      page.translations?.[0] ??
      fallbackPage.translations?.[0];

    return { current, page };
  } catch {
    return { current: fallbackPage.translations?.[0], page: fallbackPage };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = normalizeLocale(locale);
  const { current } = await getHomeContent(locale);

  return buildMetadata({
    title:
      current?.seoTitle ||
      current?.title ||
      fallbackContent[activeLocale].title,
    description:
      current?.seoDescription ||
      current?.metaDescription ||
      current?.summary ||
      fallbackContent[activeLocale].summary,
    canonicalPath: `/${activeLocale}`,
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
  const activeLocale = normalizeLocale(locale);
  const t = fallbackContent[activeLocale];
  const { current, page } = await getHomeContent(locale);
  const heroTitle = current?.title ?? t.title;
  const heroSummary = current?.summary ?? t.summary;
  const highlights = blockCards(page.blocks, activeLocale);

  return (
    <main>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd
        data={webPageJsonLd({
          name: heroTitle,
          description: heroSummary,
          path: `/${activeLocale}`,
          locale: activeLocale,
        })}
      />

      <section className="overflow-hidden bg-[#07111f] text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
          <div className="flex max-w-3xl flex-col justify-center">
            <p className="mb-5 w-fit rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#9bd3ff]">
              {t.eyebrow}
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              {heroSummary}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${activeLocale}/products`}
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#d71920] px-6 text-sm font-bold text-white transition hover:bg-[#b8141a]"
              >
                {t.primaryCta}
              </Link>
              <Link
                href={`/${activeLocale}/contact`}
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 px-6 text-sm font-bold text-white transition hover:border-white/50"
              >
                {t.secondaryCta}
              </Link>
            </div>
          </div>

          <figure className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0c1a2f] shadow-2xl shadow-black/30">
            <picture>
              <source
                srcSet="/images/kron-access-command.avif"
                type="image/avif"
              />
              <source
                srcSet="/images/kron-access-command.webp"
                type="image/webp"
              />
              <Image
                src="/images/kron-access-command.webp"
                alt={
                  activeLocale === 'tr'
                    ? 'Krontech erisim operasyonlari komuta merkezi ekran gorseli'
                    : 'Krontech access operations command center visual'
                }
                width={1600}
                height={1000}
                className="h-full min-h-[360px] w-full object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 48vw"
              />
            </picture>
            <figcaption className="sr-only">
              {activeLocale === 'tr'
                ? 'Yetkili oturum, onay ve denetim kaniti metriklerini gosterir.'
                : 'Shows privileged session, approval and audit evidence metrics.'}
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-slate-950">
              {t.productsTitle}
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              {t.productsSummary}
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {productCards[activeLocale].map((card) => (
              <article
                key={card.title}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="grid size-10 place-items-center rounded-md bg-[#d71920]/10 text-sm font-black text-[#d71920]">
                  {card.accent}
                </span>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">
                  {card.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <h2 className="text-3xl font-semibold text-slate-950">
              {t.cmsTitle}
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              {t.cmsSummary}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((card) => (
              <article
                key={card.title}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d71920]">
                  {card.accent}
                </p>
                <h3 className="mt-4 text-lg font-semibold text-slate-950">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {card.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
