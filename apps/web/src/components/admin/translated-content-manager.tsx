'use client';

import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/admin/api';
import { getAdminToken } from '@/lib/admin/auth';
import { ProtectedAdmin } from './protected-admin';

const LOCALES = ['TR', 'EN'] as const;
const STATUSES = ['DRAFT', 'PUBLISHED', 'SCHEDULED'] as const;
const RESOURCE_TYPES = [
  'DATASHEET',
  'CASE_STUDY',
  'WHITEPAPER',
  'PODCAST',
  'OTHER',
] as const;

type Locale = (typeof LOCALES)[number];
type PublishStatus = (typeof STATUSES)[number];
type RootKey =
  | 'authorName'
  | 'externalUrl'
  | 'featuredImageId'
  | 'fileId'
  | 'heroImageId'
  | 'productCode'
  | 'resourceType';
type TranslationKey =
  | 'canonicalUrl'
  | 'content'
  | 'excerpt'
  | 'longDescription'
  | 'ogDescription'
  | 'ogTitle'
  | 'seoDescription'
  | 'seoTitle'
  | 'shortDescription'
  | 'slug'
  | 'summary'
  | 'title';

type RootState = Record<RootKey, string>;
type TranslationState = Record<TranslationKey, string>;

type RootField = {
  help?: string;
  key: RootKey;
  label: string;
  mediaKind?: 'all' | 'image';
  options?: readonly string[];
  required?: boolean;
  type?: 'media' | 'select' | 'text';
};

type TranslationField = {
  key: TranslationKey;
  label: string;
  multiline?: boolean;
  required?: boolean;
  rows?: number;
};

type ManagerConfig = {
  description: string;
  endpoint: '/blog' | '/products' | '/resources';
  emptyText: string;
  entityLabel: string;
  rootDefaults?: Partial<RootState>;
  rootFields: RootField[];
  title: string;
  translationFields: TranslationField[];
};

type ContentTranslation = Partial<Record<TranslationKey, string | null>> & {
  locale: Locale;
  slug: string;
  title: string;
};

type ContentItem = Partial<Record<RootKey, string | null>> & {
  createdAt?: string;
  id: string;
  publishedAt?: string | null;
  status: PublishStatus;
  translations: ContentTranslation[];
  updatedAt?: string;
};

type MediaAsset = {
  fileName: string;
  id: string;
  mimeType?: string;
  publicUrl: string;
};

type EditorState = {
  id?: string;
  root: RootState;
  status: PublishStatus;
  translations: Record<Locale, TranslationState>;
};

type PayloadTranslation = {
  locale: Locale;
  slug: string;
  title: string;
} & Partial<Record<TranslationKey, string>>;

export const contentManagerConfigs = {
  products: {
    description:
      'Product code, TR/EN product copy, SEO fields and publish state in one editor.',
    emptyText: 'No products yet. Create the first product from the form.',
    endpoint: '/products',
    entityLabel: 'Product',
    rootFields: [
      {
        help: 'Unique code used by the API, for example kron-pam.',
        key: 'productCode',
        label: 'Product code',
        required: true,
      },
      {
        help: 'Shown on the public product detail hero.',
        key: 'heroImageId',
        label: 'Hero image',
        mediaKind: 'image',
        type: 'media',
      },
    ],
    title: 'Products',
    translationFields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'slug', label: 'Slug', required: true },
      {
        key: 'shortDescription',
        label: 'Short description',
        multiline: true,
      },
      {
        key: 'longDescription',
        label: 'Long description',
        multiline: true,
        rows: 8,
      },
      { key: 'seoTitle', label: 'SEO title' },
      {
        key: 'seoDescription',
        label: 'SEO description',
        multiline: true,
      },
      { key: 'ogTitle', label: 'OG title' },
      {
        key: 'ogDescription',
        label: 'OG description',
        multiline: true,
      },
      { key: 'canonicalUrl', label: 'Canonical URL' },
    ],
  },
  blog: {
    description:
      'Create and update blog posts with author, localized article content and metadata.',
    emptyText: 'No blog posts yet. Create the first article from the form.',
    endpoint: '/blog',
    entityLabel: 'Blog post',
    rootFields: [
      { key: 'authorName', label: 'Author name' },
      {
        help: 'Shown on public blog detail and lists.',
        key: 'featuredImageId',
        label: 'Featured image',
        mediaKind: 'image',
        type: 'media',
      },
    ],
    title: 'Blog',
    translationFields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'slug', label: 'Slug', required: true },
      { key: 'excerpt', label: 'Excerpt', multiline: true },
      { key: 'content', label: 'Content', multiline: true, rows: 10 },
      { key: 'seoTitle', label: 'SEO title' },
      {
        key: 'seoDescription',
        label: 'SEO description',
        multiline: true,
      },
      { key: 'ogTitle', label: 'OG title' },
      {
        key: 'ogDescription',
        label: 'OG description',
        multiline: true,
      },
      { key: 'canonicalUrl', label: 'Canonical URL' },
    ],
  },
  resources: {
    description:
      'Manage resource type, external URL, localized titles and SEO summaries.',
    emptyText: 'No resources yet. Create the first resource from the form.',
    endpoint: '/resources',
    entityLabel: 'Resource',
    rootDefaults: { resourceType: 'DATASHEET' },
    rootFields: [
      {
        key: 'resourceType',
        label: 'Resource type',
        options: RESOURCE_TYPES,
        required: true,
        type: 'select',
      },
      { key: 'externalUrl', label: 'External URL' },
      {
        help: 'Optional downloadable file from the media library.',
        key: 'fileId',
        label: 'Resource file',
        mediaKind: 'all',
        type: 'media',
      },
    ],
    title: 'Resources',
    translationFields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'slug', label: 'Slug', required: true },
      { key: 'summary', label: 'Summary', multiline: true },
      { key: 'seoTitle', label: 'SEO title' },
      {
        key: 'seoDescription',
        label: 'SEO description',
        multiline: true,
      },
    ],
  },
} satisfies Record<string, ManagerConfig>;

export function ProductContentManager() {
  return <TranslatedContentManager config={contentManagerConfigs.products} />;
}

export function BlogContentManager() {
  return <TranslatedContentManager config={contentManagerConfigs.blog} />;
}

export function ResourceContentManager() {
  return <TranslatedContentManager config={contentManagerConfigs.resources} />;
}

export function TranslatedContentManager({
  config,
}: {
  config: ManagerConfig;
}) {
  const [editor, setEditor] = useState<EditorState>(() =>
    createEmptyEditor(config),
  );
  const [error, setError] = useState('');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaAsset[]>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === editor.id),
    [editor.id, items],
  );

  const loadItems = useCallback(async () => {
    try {
      setError('');
      const token = getAdminToken();
      const data = await adminFetch<ContentItem[]>(config.endpoint, token);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError(`${config.title} could not be loaded.`);
    } finally {
      setLoading(false);
    }
  }, [config.endpoint, config.title]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (!config.rootFields.some((field) => field.type === 'media')) {
      return;
    }

    async function loadMedia() {
      try {
        const token = getAdminToken();
        const data = await adminFetch<MediaAsset[]>('/media', token);
        setMediaItems(Array.isArray(data) ? data : []);
      } catch {
        setMediaItems([]);
      }
    }

    void loadMedia();
  }, [config.rootFields]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = buildPayload(editor, config);
      const token = getAdminToken();
      const saved = editor.id
        ? await adminFetch<ContentItem>(`${config.endpoint}/${editor.id}`, token, {
            body: JSON.stringify(payload),
            method: 'PATCH',
          })
        : await adminFetch<ContentItem>(config.endpoint, token, {
            body: JSON.stringify(payload),
            method: 'POST',
          });

      setEditor(itemToEditor(saved, config));
      await loadItems();
      setMessage(`${config.entityLabel} saved.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `${config.entityLabel} could not be saved.`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!editor.id) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const token = getAdminToken();
      const published = await adminFetch<ContentItem>(
        `${config.endpoint}/${editor.id}/publish`,
        token,
        { method: 'PATCH' },
      );

      setEditor(itemToEditor(published, config));
      await loadItems();
      setMessage(`${config.entityLabel} published.`);
    } catch {
      setError(`${config.entityLabel} could not be published.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedAdmin>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
              CMS
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">
              {config.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              {config.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditor(createEmptyEditor(config));
              setError('');
              setMessage('');
            }}
            className="h-10 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-800 transition hover:border-gray-500"
          >
            New {config.entityLabel.toLowerCase()}
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <aside className="space-y-3">
            {loading ? <p>Loading...</p> : null}
            {!loading && items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                {config.emptyText}
              </div>
            ) : null}

            {items.map((item) => {
              const translation = getPrimaryTranslation(item);
              const active = item.id === editor.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setEditor(itemToEditor(item, config));
                    setError('');
                    setMessage('');
                  }}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    active
                      ? 'border-gray-950 bg-gray-950 text-white'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                      {getItemKind(item, config)}
                    </span>
                    <StatusBadge status={item.status} active={active} />
                  </div>
                  <div className="mt-3 font-semibold">
                    {translation?.title || `Untitled ${config.entityLabel}`}
                  </div>
                  <div
                    className={`mt-1 text-sm ${
                      active ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    /{translation?.slug || 'missing-slug'}
                  </div>
                </button>
              );
            })}
          </aside>

          <form
            onSubmit={handleSave}
            className="space-y-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">
                  Status
                </span>
                <select
                  value={editor.status}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      status: event.target.value as PublishStatus,
                    }))
                  }
                  className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              {config.rootFields.map((field) => (
                <RootFieldControl
                  key={field.key}
                  editor={editor}
                  field={field}
                  mediaItems={mediaItems}
                  setEditor={setEditor}
                />
              ))}

              <div className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">
                  Current record
                </span>
                <div className="flex h-11 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">
                  {selectedItem?.id ?? 'New record'}
                </div>
              </div>
            </div>

            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  Translations
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Title and slug are required for each locale you want to save.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {LOCALES.map((locale) => (
                  <TranslationCard
                    key={locale}
                    config={config}
                    editor={editor}
                    locale={locale}
                    setEditor={setEditor}
                  />
                ))}
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={!editor.id || saving}
                onClick={handlePublish}
                className="h-11 rounded-md border border-gray-300 px-5 text-sm font-bold text-gray-900 transition hover:border-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Publish
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-11 rounded-md bg-gray-950 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedAdmin>
  );
}

function RootFieldControl({
  editor,
  field,
  mediaItems,
  setEditor,
}: {
  editor: EditorState;
  field: RootField;
  mediaItems: MediaAsset[];
  setEditor: Dispatch<SetStateAction<EditorState>>;
}) {
  if (field.type === 'media') {
    const selectableMedia = mediaItems.filter((item) =>
      field.mediaKind === 'image' ? item.mimeType?.startsWith('image/') : true,
    );

    return (
      <label className="space-y-2">
        <span className="text-sm font-semibold text-gray-700">
          {field.label}
        </span>
        <select
          value={editor.root[field.key]}
          onChange={(event) => updateRoot(field.key, event.target.value, setEditor)}
          className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm"
        >
          <option value="">No media selected</option>
          {selectableMedia.map((item) => (
            <option key={item.id} value={item.id}>
              {item.fileName}
            </option>
          ))}
        </select>
        {field.help ? <span className="block text-xs text-gray-500">{field.help}</span> : null}
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <label className="space-y-2">
        <span className="text-sm font-semibold text-gray-700">
          {field.label}
        </span>
        <select
          value={editor.root[field.key]}
          onChange={(event) => updateRoot(field.key, event.target.value, setEditor)}
          className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm"
        >
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-gray-700">{field.label}</span>
      <input
        value={editor.root[field.key]}
        onChange={(event) => updateRoot(field.key, event.target.value, setEditor)}
        className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm"
      />
      {field.help ? <span className="block text-xs text-gray-500">{field.help}</span> : null}
    </label>
  );
}

function TranslationCard({
  config,
  editor,
  locale,
  setEditor,
}: {
  config: ManagerConfig;
  editor: EditorState;
  locale: Locale;
  setEditor: Dispatch<SetStateAction<EditorState>>;
}) {
  const translation = editor.translations[locale];

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-950">{locale}</h3>
      <div className="mt-4 grid gap-3">
        {config.translationFields.map((field) =>
          field.multiline ? (
            <TextArea
              key={field.key}
              label={field.label}
              rows={field.rows ?? 3}
              value={translation[field.key]}
              onChange={(value) =>
                updateTranslation(locale, field.key, value, setEditor)
              }
            />
          ) : (
            <TextField
              key={field.key}
              label={field.label}
              value={translation[field.key]}
              onChange={(value) =>
                updateTranslation(locale, field.key, value, setEditor)
              }
            />
          ),
        )}
      </div>
    </div>
  );
}

function createEmptyEditor(config: ManagerConfig): EditorState {
  return {
    root: {
      authorName: config.rootDefaults?.authorName ?? '',
      externalUrl: config.rootDefaults?.externalUrl ?? '',
      featuredImageId: config.rootDefaults?.featuredImageId ?? '',
      fileId: config.rootDefaults?.fileId ?? '',
      heroImageId: config.rootDefaults?.heroImageId ?? '',
      productCode: config.rootDefaults?.productCode ?? '',
      resourceType: config.rootDefaults?.resourceType ?? '',
    },
    status: 'DRAFT',
    translations: {
      EN: createEmptyTranslation(),
      TR: createEmptyTranslation(),
    },
  };
}

function createEmptyTranslation(): TranslationState {
  return {
    canonicalUrl: '',
    content: '',
    excerpt: '',
    longDescription: '',
    ogDescription: '',
    ogTitle: '',
    seoDescription: '',
    seoTitle: '',
    shortDescription: '',
    slug: '',
    summary: '',
    title: '',
  };
}

function itemToEditor(item: ContentItem, config: ManagerConfig): EditorState {
  const editor = createEmptyEditor(config);

  for (const field of config.rootFields) {
    const value = item[field.key];
    editor.root[field.key] = typeof value === 'string' ? value : editor.root[field.key];
  }

  for (const locale of LOCALES) {
    const translation = item.translations.find((entry) => entry.locale === locale);
    if (!translation) continue;

    for (const field of config.translationFields) {
      const value = translation[field.key];
      editor.translations[locale][field.key] = typeof value === 'string' ? value : '';
    }
  }

  return {
    ...editor,
    id: item.id,
    status: item.status,
  };
}

function buildPayload(editor: EditorState, config: ManagerConfig) {
  const payload: Record<string, unknown> = {
    status: editor.status,
    translations: buildTranslations(editor, config),
  };

  for (const field of config.rootFields) {
    const value = editor.root[field.key].trim();

    if (field.required && !value) {
      throw new Error(`${field.label} is required.`);
    }

    if (field.type === 'media') {
      payload[field.key] = value || null;
      continue;
    }

    if (value) {
      payload[field.key] = value;
    }
  }

  return payload;
}

function buildTranslations(editor: EditorState, config: ManagerConfig) {
  const translations: PayloadTranslation[] = [];

  for (const locale of LOCALES) {
    const source = editor.translations[locale];
    const hasContent = config.translationFields.some((field) =>
      Boolean(source[field.key].trim()),
    );

    if (!hasContent) continue;

    if (!source.title.trim() || !source.slug.trim()) {
      throw new Error(`${locale} requires both title and slug.`);
    }

    const translation: PayloadTranslation = {
      locale,
      slug: source.slug.trim(),
      title: source.title.trim(),
    };

    for (const field of config.translationFields) {
      if (field.key === 'title' || field.key === 'slug') continue;
      const value = source[field.key].trim();

      if (value) {
        translation[field.key] = value;
      }
    }

    translations.push(translation);
  }

  if (translations.length === 0) {
    throw new Error('Add at least one translation.');
  }

  return translations;
}

function getPrimaryTranslation(item: ContentItem) {
  return (
    item.translations.find((translation) => translation.locale === 'TR') ??
    item.translations.find((translation) => translation.locale === 'EN') ??
    item.translations[0]
  );
}

function getItemKind(item: ContentItem, config: ManagerConfig) {
  if (item.productCode) return item.productCode;
  if (item.resourceType) return item.resourceType;
  if (item.authorName) return item.authorName;

  return config.entityLabel;
}

function updateRoot(
  field: RootKey,
  value: string,
  setEditor: Dispatch<SetStateAction<EditorState>>,
) {
  setEditor((current) => ({
    ...current,
    root: {
      ...current.root,
      [field]: value,
    },
  }));
}

function updateTranslation(
  locale: Locale,
  field: TranslationKey,
  value: string,
  setEditor: Dispatch<SetStateAction<EditorState>>,
) {
  setEditor((current) => ({
    ...current,
    translations: {
      ...current.translations,
      [locale]: {
        ...current.translations[locale],
        [field]: value,
      },
    },
  }));
}

function StatusBadge({
  active,
  status,
}: {
  active?: boolean;
  status: PublishStatus;
}) {
  return (
    <span
      className={`rounded-md px-2 py-1 text-xs font-bold ${
        active
          ? 'bg-white/10 text-white'
          : status === 'PUBLISHED'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-amber-50 text-amber-700'
      }`}
    >
      {status}
    </span>
  );
}

function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
      />
    </label>
  );
}

function TextArea({
  label,
  onChange,
  rows,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  rows: number;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6"
      />
    </label>
  );
}
