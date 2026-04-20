import { getPublishedProduct } from '@/lib/products';
import { buildAbsoluteUrl, buildMetadata, productJsonLd } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublishedProduct('TR', slug);
  const tr = product.translations.find((t: any) => t.locale === 'TR');

  return buildMetadata({
    title: tr?.seoTitle || tr?.title || 'Product',
    description: tr?.seoDescription || tr?.shortDescription || 'Product detail',
    path: `/products/${slug}`,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublishedProduct('TR', slug);
  const tr = product.translations.find((t: any) => t.locale === 'TR');

  const jsonLd = productJsonLd({
    name: tr?.title || '',
    description: tr?.shortDescription || tr?.longDescription || '',
    url: buildAbsoluteUrl(`/products/${slug}`),
  });

  return (
    <main className="p-8 space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header>
        <h1 className="text-3xl font-bold">{tr?.title}</h1>
        <p className="text-lg text-gray-600">{tr?.shortDescription}</p>
      </header>

      <section className="prose max-w-none">
        <p>{tr?.longDescription}</p>
      </section>

      <aside className="rounded-xl border p-4">
        <div className="text-sm text-gray-500">Product Code</div>
        <div className="font-medium">{product.productCode}</div>
      </aside>
    </main>
  );
}