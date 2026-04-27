const SITE_NAME = 'Krontech Case';
const BRAND_NAME = 'Krontech';

export function buildAbsoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ).replace(/\/$/, '');

  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildLocalizedAlternates(pathByLocale: {
  tr?: string;
  en?: string;
}) {
  return {
    canonical: pathByLocale.tr
      ? buildAbsoluteUrl(pathByLocale.tr)
      : pathByLocale.en
        ? buildAbsoluteUrl(pathByLocale.en)
        : buildAbsoluteUrl('/'),
    languages: {
      ...(pathByLocale.tr ? { 'tr-TR': buildAbsoluteUrl(pathByLocale.tr) } : {}),
      ...(pathByLocale.en ? { 'en-US': buildAbsoluteUrl(pathByLocale.en) } : {}),
      ...(pathByLocale.en ? { 'x-default': buildAbsoluteUrl(pathByLocale.en) } : {}),
    },
  };
}

export function buildMetadata({
  title,
  description,
  canonicalPath,
  alternatePaths,
  ogDescription,
  ogTitle,
  robotsFollow = true,
  robotsIndex = true,
}: {
  title: string;
  description: string;
  canonicalPath: string;
  alternatePaths?: {
    tr?: string;
    en?: string;
  };
  ogDescription?: string | null;
  ogTitle?: string | null;
  robotsFollow?: boolean;
  robotsIndex?: boolean;
}) {
  const canonicalUrl = buildAbsoluteUrl(canonicalPath);
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;

  return {
    title,
    description,
    alternates: alternatePaths
      ? buildLocalizedAlternates(alternatePaths)
      : {
          canonical: canonicalUrl,
        },
    openGraph: {
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedOgTitle,
      description: resolvedOgDescription,
    },
    robots: {
      index: robotsIndex,
      follow: robotsFollow,
    },
  };
}

export function productJsonLd({
  name,
  description,
  url,
  image,
}: {
  name: string;
  description: string;
  url: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url,
    ...(image ? { image } : {}),
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
  };
}

export function articleJsonLd({
  headline,
  description,
  url,
  authorName,
  image,
}: {
  headline: string;
  description: string;
  url: string;
  authorName?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url,
    ...(image ? { image } : {}),
    author: {
      '@type': 'Person',
      name: authorName || 'Krontech Team',
    },
    publisher: {
      '@type': 'Organization',
      name: BRAND_NAME,
    },
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_NAME,
    url: buildAbsoluteUrl('/'),
    brand: SITE_NAME,
    description:
      'Privileged access security, secure remote operations, and identity governance for enterprise teams.',
    sameAs: ['https://krontech.com/'],
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: buildAbsoluteUrl('/'),
    publisher: {
      '@type': 'Organization',
      name: BRAND_NAME,
    },
    inLanguage: ['tr-TR', 'en-US'],
  };
}

export function webPageJsonLd({
  name,
  description,
  path,
  locale,
}: {
  name: string;
  description: string;
  path: string;
  locale: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: buildAbsoluteUrl(path),
    inLanguage: locale === 'tr' ? 'tr-TR' : 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: buildAbsoluteUrl('/'),
    },
    about: [
      'privileged access management',
      'secure remote access',
      'identity governance',
      'enterprise cybersecurity',
    ],
  };
}

export function collectionPageJsonLd({
  name,
  description,
  path,
  locale,
  items,
}: {
  name: string;
  description: string;
  path: string;
  locale: string;
  items?: { name: string; url: string }[];
}) {
  return {
    ...webPageJsonLd({ name, description, path, locale }),
    '@type': 'CollectionPage',
    ...(items?.length
      ? {
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: items.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              url: item.url,
            })),
          },
        }
      : {}),
  };
}

export function faqJsonLd(
  items: {
    answer: string;
    question: string;
  }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbJsonLd(
  items: {
    name: string;
    path: string;
  }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.path),
    })),
  };
}

export function contactPageJsonLd({
  path,
  locale,
}: {
  path: string;
  locale: string;
}) {
  return {
    ...webPageJsonLd({
      name: locale === 'tr' ? 'Iletisim' : 'Contact',
      description:
        locale === 'tr'
          ? 'Krontech ekibiyle iletisim kurun.'
          : 'Contact the Krontech team.',
      path,
      locale,
    }),
    '@type': 'ContactPage',
  };
}
