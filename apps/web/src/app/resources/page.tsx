import { getPublishedResources } from '@/lib/resources';

export default async function ResourcesPage() {
  const resources = await getPublishedResources('TR');

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Kaynaklar</h1>

      <div className="space-y-4">
        {resources.map((resource: any) => {
          const tr = resource.translations.find((t: any) => t.locale === 'TR');

          return (
            <article key={resource.id} className="rounded-xl border p-4">
              <div className="text-sm text-gray-500">{resource.resourceType}</div>
              <h2 className="text-xl font-semibold">{tr?.title}</h2>
              <p className="text-gray-600">{tr?.summary}</p>
              {resource.externalUrl ? (
                <a
                  href={resource.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-blue-600 underline"
                >
                  Kaynağı aç
                </a>
              ) : null}
            </article>
          );
        })}
      </div>
    </main>
  );
}