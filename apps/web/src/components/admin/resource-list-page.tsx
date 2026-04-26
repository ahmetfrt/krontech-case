'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/api';
import { getAdminToken } from '@/lib/admin/auth';
import { ProtectedAdmin } from './protected-admin';

type TranslationLike = {
  locale?: string;
  slug?: string | null;
  summary?: string | null;
  title?: string | null;
};

type ResourceItem = Record<string, unknown> & {
  createdAt?: string;
  id?: string;
  status?: string;
  translations?: TranslationLike[];
  updatedAt?: string;
};

export function ResourceListPage({
  title,
  endpoint,
}: {
  title: string;
  endpoint: string;
}) {
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = getAdminToken();
        const data = await adminFetch<unknown>(endpoint, token);
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setError('Veri alınamadı.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [endpoint]);

  return (
    <ProtectedAdmin>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
            CMS
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">{title}</h1>
        </div>

        {loading ? <p>Yükleniyor...</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}

        {!loading && !error && items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-600">
            Henüz kayıt yok.
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item, index) => {
            const itemTitle = getItemTitle(item, title);
            const translations = item.translations ?? [];

            return (
              <article
                key={item.id ?? `${endpoint}-${index}`}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      {getItemKind(item, title)}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-gray-950">
                      {itemTitle}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {getItemSubtitle(item)}
                    </p>
                  </div>

                  {item.status ? <StatusBadge status={item.status} /> : null}
                </div>

                {translations.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {translations.map((translation) => (
                      <span
                        key={`${translation.locale}-${translation.slug}`}
                        className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700"
                      >
                        {translation.locale}: {translation.slug || 'slug yok'}
                      </span>
                    ))}
                  </div>
                ) : null}

                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  {getDetailRows(item).map((row) => (
                    <div key={row.label}>
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {row.label}
                      </dt>
                      <dd className="mt-1 break-words text-gray-900">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            );
          })}
        </div>
      </div>
    </ProtectedAdmin>
  );
}

function StatusBadge({ status }: { status: string }) {
  const published = status === 'PUBLISHED';

  return (
    <span
      className={`rounded-md px-2.5 py-1 text-xs font-bold ${
        published
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-amber-50 text-amber-700'
      }`}
    >
      {status}
    </span>
  );
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getFirstTranslation(item: ResourceItem) {
  return item.translations?.[0];
}

function getItemTitle(item: ResourceItem, fallback: string) {
  const translation = getFirstTranslation(item);

  return (
    translation?.title ||
    asString(item.name) ||
    asString(item.productCode) ||
    asString(item.fileName) ||
    asString(item.id) ||
    fallback
  );
}

function getItemSubtitle(item: ResourceItem) {
  const translation = getFirstTranslation(item);

  return (
    translation?.summary ||
    asString(item.shortDescription) ||
    asString(item.externalUrl) ||
    asString(item.mimeType) ||
    'Özet bilgi yok.'
  );
}

function getItemKind(item: ResourceItem, fallback: string) {
  return (
    asString(item.pageType) ||
    asString(item.resourceType) ||
    asString(item.formType) ||
    asString(item.type) ||
    fallback
  );
}

function getDetailRows(item: ResourceItem) {
  const rows = [
    { label: 'ID', value: asString(item.id) },
    { label: 'Created', value: formatDate(item.createdAt) },
    { label: 'Updated', value: formatDate(item.updatedAt) },
    { label: 'Published', value: formatDate(item.publishedAt) },
  ];

  return rows.filter((row): row is { label: string; value: string } =>
    Boolean(row.value),
  );
}

function formatDate(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toLocaleString('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
