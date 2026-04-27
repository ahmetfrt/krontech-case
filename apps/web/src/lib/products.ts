export type ProductTranslation = {
  canonicalUrl?: string | null;
  locale: string;
  longDescription?: string | null;
  ogDescription?: string | null;
  ogTitle?: string | null;
  robotsFollow?: boolean | null;
  robotsIndex?: boolean | null;
  seoDescription?: string | null;
  seoTitle?: string | null;
  shortDescription?: string | null;
  slug: string;
  structuredDataJson?: unknown;
  title: string;
};

export type PublishedProduct = {
  heroImage?: {
    publicUrl?: string | null;
  } | null;
  productCode: string;
  publishedAt?: string | Date | null;
  translations: ProductTranslation[];
  updatedAt?: string | Date | null;
};

const API_BASE_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

export async function getPublishedProducts(locale: string) {
  const res = await fetch(`${API_BASE_URL}/public/products/${locale}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  return (await res.json()) as PublishedProduct[];
}

export async function getPublishedProduct(locale: string, slug: string) {
  const res = await fetch(`${API_BASE_URL}/public/products/${locale}/${slug}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch product');
  }

  return (await res.json()) as PublishedProduct;
}
