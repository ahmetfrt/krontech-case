import { getPublishedProduct } from '@/lib/products';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublishedProduct('TR', slug);

  const translation = product.translations.find((t: any) => t.locale === 'TR');

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">{translation?.title}</h1>
      <p className="text-lg text-gray-600">{translation?.shortDescription}</p>
      <div className="prose max-w-none">
        <p>{translation?.longDescription}</p>
      </div>
      <div className="rounded-xl border p-4">
        <div className="text-sm text-gray-500">Product Code</div>
        <div className="font-medium">{product.productCode}</div>
      </div>
    </main>
  );
}