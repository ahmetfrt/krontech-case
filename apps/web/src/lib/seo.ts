export function buildAbsoluteUrl(path: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
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
}: {
  title: string;
  description: string;
  canonicalPath: string;
  alternatePaths?: {
    tr?: string;
    en?: string;
  };
}) {
  const canonicalUrl = buildAbsoluteUrl(canonicalPath);

  return {
    title,
    description,
    alternates: alternatePaths
      ? buildLocalizedAlternates(alternatePaths)
      : {
          canonical: canonicalUrl,
        },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Krontech Case',
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function productJsonLd({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url,
    brand: {
      '@type': 'Brand',
      name: 'Krontech',
    },
  };
}

export function articleJsonLd({
  headline,
  description,
  url,
  authorName,
}: {
  headline: string;
  description: string;
  url: string;
  authorName?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url,
    author: {
      '@type': 'Person',
      name: authorName || 'Krontech Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Krontech',
    },
  };
}