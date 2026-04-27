type PageTranslation = {
  canonicalUrl?: string | null;
  locale: string;
  ogDescription?: string | null;
  ogTitle?: string | null;
  robotsFollow?: boolean | null;
  robotsIndex?: boolean | null;
  seoDescription?: string | null;
  seoTitle?: string | null;
  slug: string;
  structuredDataJson?: unknown;
  summary?: string | null;
  title: string;
};

type PageBlock = {
  configJson?: unknown;
  id?: string;
  sortOrder?: number;
  type?: string | null;
};

export type PublishedPage = {
  blocks?: PageBlock[];
  pageType?: string;
  publishedAt?: string | Date | null;
  translations?: PageTranslation[];
  updatedAt?: string | Date | null;
};

const API_BASE_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

export async function getPublishedPages(locale: string) {
  const res = await fetch(`${API_BASE_URL}/public/pages/${locale}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch pages');
  }

  return (await res.json()) as PublishedPage[];
}

export async function getPublishedPage(locale: string, slug: string) {
  const encodedSlug = encodeURIComponent(slug);
  const res = await fetch(
    `${API_BASE_URL}/public/pages/${locale}/${encodedSlug}`,
    {
      next: { revalidate: 60 },
    },
  );

  if (!res.ok) {
    throw new Error('Failed to fetch page');
  }

  return (await res.json()) as PublishedPage;
}
