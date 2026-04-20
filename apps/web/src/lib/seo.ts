export function buildAbsoluteUrl(path: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  const url = buildAbsoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
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