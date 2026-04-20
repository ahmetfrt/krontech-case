import { getPublishedProduct } from '@/lib/products';
import {
  buildAbsoluteUrl,
  buildMetadata,
  productJsonLd,
} from '@/lib/seo';
import { normalizeApiLocale } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const apiLocale = normalizeApiLocale(locale);

  const product = await getPublishedProduct(apiLocale, slug);
  const current = product.translations.find((t: any) => t.locale === apiLocale);

  return buildMetadata({
    title: current?.seoTitle || current?.title || 'Product',
    description:
      current?.seoDescription ||
      current?.shortDescription ||
      'Product detail',
    path: `/${locale}/products/${slug}`,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const apiLocale = normalizeApiLocale(locale);

  const product = await getPublishedProduct(apiLocale, slug);
  const current = product.translations.find((t: any) => t.locale === apiLocale);

  const jsonLd = productJsonLd({
    name: current?.title || '',
    description: current?.shortDescription || current?.longDescription || '',
    url: buildAbsoluteUrl(`/${locale}/products/${slug}`),
  });

  return (
    <main className="p-8 space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header>
        <h1 className="text-3xl font-bold">{current?.title}</h1>
        <p className="text-lg text-gray-600">{current?.shortDescription}</p>
      </header>

      <section className="prose max-w-none">
        <p>{current?.longDescription}</p>
      </section>

      <aside className="rounded-xl border p-4">
        <div className="text-sm text-gray-500">Product Code</div>
        <div className="font-medium">{product.productCode}</div>
      </aside>
    </main>
  );
}