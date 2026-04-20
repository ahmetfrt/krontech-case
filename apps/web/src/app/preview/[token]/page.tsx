export default async function PreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const res = await fetch(`${baseUrl}/preview/${token}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch preview');
  }

  const data = await res.json();

  if ('blocks' in data) {
    const tr = data.translations?.find((t: any) => t.locale === 'TR');

    return (
      <main className="p-8 space-y-6">
        <h1 className="text-3xl font-bold">{tr?.title}</h1>
        <p className="text-lg text-gray-600">{tr?.summary}</p>

        <section className="space-y-4">
          {data.blocks?.map((block: any) => (
            <article key={block.id} className="rounded-xl border p-4">
              <div className="text-sm text-gray-500">{block.type}</div>
              <pre className="whitespace-pre-wrap text-sm">
                {JSON.stringify(block.configJson, null, 2)}
              </pre>
            </article>
          ))}
        </section>
      </main>
    );
  }

  const tr = data.translations?.find((t: any) => t.locale === 'TR');

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">{tr?.title}</h1>
      <pre className="whitespace-pre-wrap text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}