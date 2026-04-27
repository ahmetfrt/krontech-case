export type ResourceTranslation = {
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

export type PublishedResource = {
  externalUrl?: string | null;
  file?: {
    publicUrl?: string | null;
  } | null;
  publishedAt?: string | Date | null;
  resourceType: string;
  translations: ResourceTranslation[];
  updatedAt?: string | Date | null;
};

const API_BASE_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

export async function getPublishedResources(locale: string) {
  const res = await fetch(`${API_BASE_URL}/public/resources/${locale}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch resources');
  }

  return (await res.json()) as PublishedResource[];
}

export async function getPublishedResource(locale: string, slug: string) {
  const res = await fetch(`${API_BASE_URL}/public/resources/${locale}/${slug}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch resource');
  }

  return (await res.json()) as PublishedResource;
}
