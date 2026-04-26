export async function getPublishedProducts(locale: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const res = await fetch(`${baseUrl}/public/products/${locale}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  return res.json();
}

export async function getPublishedProduct(locale: string, slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const res = await fetch(`${baseUrl}/public/products/${locale}/${slug}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch product');
  }

  return res.json();
}
