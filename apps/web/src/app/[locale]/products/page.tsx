import Image from 'next/image';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/json-ld';
import { normalizeApiLocale } from '@/lib/i18n';
import { fallbackImage, resolveMediaUrl } from '@/lib/media';
import { getPublishedProducts } from '@/lib/products';
import {
  buildAbsoluteUrl,
  buildMetadata,
  breadcrumbJsonLd,
  collectionPageJsonLd,
} from '@/lib/seo';

type ProductTranslation = {
  locale: string;
  shortDescription?: string | null;
  slug: string;
  title: string;
};

type ProductListItem = {
  heroImage?: {
    publicUrl?: string | null;
  } | null;
  id: string;
  productCode: string;
  translations: ProductTranslation[];
};

async function getProductsSafely(locale: string): Promise<ProductListItem[]> {
  try {
    return (await getPublishedProducts(locale)) as ProductListItem[];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return buildMetadata({
    title: locale === 'tr' ? 'Urunler' : 'Products',
    description:
      locale === 'tr'
        ? 'Krontech yetkili erisim ve guvenli operasyon urunleri'
        : 'Krontech privileged access and secure operations products',
    canonicalPath: `/${locale}/products`,
    alternatePaths: {
      tr: '/tr/products',
      en: '/en/products',
    },
  });
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const apiLocale = normalizeApiLocale(locale);
  const products = await getProductsSafely(apiLocale);
  const title = locale === 'tr' ? 'Urunler' : 'Products';
  const description =
    locale === 'tr'
      ? 'Kritik erisim yollarini koruyan Krontech urunlerini inceleyin.'
      : 'Explore Krontech products for protecting critical access paths.';

  const items = products
    .map((product) => {
      const current = product.translations.find(
        (translation) => translation.locale === apiLocale,
      );

      if (!current) return undefined;

      return {
        name: current.title,
        url: buildAbsoluteUrl(`/${locale}/products/${current.slug}`),
      };
    })
    .filter((item): item is { name: string; url: string } => Boolean(item));

  return (
    <main className="space-y-6 p-8">
      <JsonLd
        data={collectionPageJsonLd({
          name: title,
          description,
          path: `/${locale}/products`,
          locale,
          items,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: locale === 'tr' ? 'Ana sayfa' : 'Home', path: `/${locale}` },
          { name: title, path: `/${locale}/products` },
        ])}
      />

      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-lg text-gray-600">{description}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-gray-600 md:col-span-3">
            {locale === 'tr'
              ? 'Yayinda urun bulunamadi.'
              : 'No published products yet.'}
          </div>
        ) : null}

        {products.map((product) => {
          const current = product.translations.find(
            (translation) => translation.locale === apiLocale,
          );
          const heroUrl =
            resolveMediaUrl(product.heroImage?.publicUrl) || fallbackImage();

          if (!current) return null;

          return (
            <article
              key={product.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              <Image
                src={heroUrl}
                alt={current.title}
                width={720}
                height={420}
                className="h-48 w-full object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  {product.productCode}
                </div>
                <h2 className="mt-3 text-xl font-semibold text-gray-950">
                  {current.title}
                </h2>
                <p className="mt-2 text-gray-600">{current.shortDescription}</p>
                <Link
                  href={`/${locale}/products/${current.slug}`}
                  className="mt-4 inline-block text-blue-600 underline"
                >
                  {locale === 'tr' ? 'Detaylari incele' : 'View details'}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
