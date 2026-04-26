import { getPublishedProduct } from '@/lib/products';
import {
  buildAbsoluteUrl,
  buildMetadata,
  productJsonLd,
} from '@/lib/seo';
import { normalizeApiLocale } from '@/lib/i18n';
import Image from 'next/image';
import { fallbackImage, resolveMediaUrl } from '@/lib/media';


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const apiLocale = normalizeApiLocale(locale);

  const product = await getPublishedProduct(apiLocale, slug);
  const current = product.translations.find((t: any) => t.locale === apiLocale);

  const heroUrl =
    resolveMediaUrl(product.heroImage?.publicUrl) || fallbackImage();

  const trTranslation = product.translations.find((t: any) => t.locale === 'TR');
  const enTranslation = product.translations.find((t: any) => t.locale === 'EN');

  return buildMetadata({
    title: current?.seoTitle || current?.title || 'Product',
    description:
      current?.seoDescription ||
      current?.shortDescription ||
      'Product detail',
    canonicalPath: `/${locale}/products/${slug}`,
    alternatePaths: {
      ...(trTranslation ? { tr: `/tr/products/${trTranslation.slug}` } : {}),
      ...(enTranslation ? { en: `/en/products/${enTranslation.slug}` } : {}),
    },
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


      <div className="overflow-hidden rounded-2xl border">
        <Image
          src={heroUrl}
          alt={current?.title || 'Product image'}
          width={1200}
          height={700}
          className="h-auto w-full object-cover"
          sizes="(max-width: 768px) 100vw, 1200px"
          priority
        />
      </div>

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