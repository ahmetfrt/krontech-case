export type BlogTranslation = {
  canonicalUrl?: string | null;
  content?: string | null;
  excerpt?: string | null;
  locale: string;
  ogDescription?: string | null;
  ogTitle?: string | null;
  robotsFollow?: boolean | null;
  robotsIndex?: boolean | null;
  seoDescription?: string | null;
  seoTitle?: string | null;
  slug: string;
  structuredDataJson?: unknown;
  title: string;
};

export type PublishedBlogPost = {
  authorName?: string | null;
  featuredImage?: {
    publicUrl?: string | null;
  } | null;
  publishedAt?: string | Date | null;
  translations: BlogTranslation[];
  updatedAt?: string | Date | null;
};

const API_BASE_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

export async function getPublishedBlogList(locale: string) {
  const res = await fetch(`${API_BASE_URL}/public/blog/${locale}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch blog list');
  }

  return (await res.json()) as PublishedBlogPost[];
}

export async function getPublishedBlogPost(locale: string, slug: string) {
  const res = await fetch(`${API_BASE_URL}/public/blog/${locale}/${slug}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch blog post');
  }

  return (await res.json()) as PublishedBlogPost;
}
