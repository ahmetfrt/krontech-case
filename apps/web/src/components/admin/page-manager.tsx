'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/admin/api';
import { getAdminToken } from '@/lib/admin/auth';
import { ProtectedAdmin } from './protected-admin';

const LOCALES = ['TR', 'EN'] as const;
const PAGE_TYPES = ['HOME', 'STANDARD', 'RESOURCES', 'CONTACT'] as const;
const STATUSES = ['DRAFT', 'PUBLISHED', 'SCHEDULED'] as const;

type Locale = (typeof LOCALES)[number];
type PageType = (typeof PAGE_TYPES)[number];
type PublishStatus = (typeof STATUSES)[number];

type PageTranslation = {
  canonicalUrl?: string | null;
  locale: Locale;
  robotsFollow?: boolean;
  robotsIndex?: boolean;
  seoDescription?: string | null;
  seoTitle?: string | null;
  slug: string;
  summary?: string | null;
  title: string;
};

type PageBlock = {
  configJson: unknown;
  id?: string;
  sortOrder: number;
  type: string;
};

type PageItem = {
  blocks: PageBlock[];
  createdAt?: string;
  id: string;
  pageType: PageType;
  publishedAt?: string | null;
  status: PublishStatus;
  translations: PageTranslation[];
  updatedAt?: string;
};

type EditorTranslation = {
  canonicalUrl: string;
  robotsFollow: boolean;
  robotsIndex: boolean;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  summary: string;
  title: string;
};

type EditorBlock = {
  configJsonText: string;
  localId: string;
  sortOrder: number;
  type: string;
};

type EditorState = {
  blocks: EditorBlock[];
  id?: string;
  pageType: PageType;
  status: PublishStatus;
  translations: Record<Locale, EditorTranslation>;
};

type PagePayload = {
  blocks: {
    configJson: unknown;
    sortOrder: number;
    type: string;
  }[];
  pageType: PageType;
  status: PublishStatus;
  translations: {
    canonicalUrl?: string;
    locale: Locale;
    robotsFollow: boolean;
    robotsIndex: boolean;
    seoDescription?: string;
    seoTitle?: string;
    slug: string;
    summary?: string;
    title: string;
  }[];
};

export function PageManager() {
  const [editor, setEditor] = useState<EditorState>(() => createEmptyEditor());
  const [error, setError] = useState('');
  const [items, setItems] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedPage = useMemo(
    () => items.find((item) => item.id === editor.id),
    [editor.id, items],
  );

  const loadPages = useCallback(async () => {
    try {
      setError('');
      const token = getAdminToken();
      const data = await adminFetch<PageItem[]>('/pages', token);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError('Sayfalar alınamadı.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = buildPayload(editor);
      const token = getAdminToken();
      const saved = editor.id
        ? await adminFetch<PageItem>(`/pages/${editor.id}`, token, {
            body: JSON.stringify(payload),
            method: 'PATCH',
          })
        : await adminFetch<PageItem>('/pages', token, {
            body: JSON.stringify(payload),
            method: 'POST',
          });

      setEditor(pageToEditor(saved));
      await loadPages();
      setMessage('Sayfa kaydedildi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sayfa kaydedilemedi.');
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
      const published = await adminFetch<PageItem>(
        `/pages/${editor.id}/publish`,
        token,
        { method: 'PATCH' },
      );

      setEditor(pageToEditor(published));
      await loadPages();
      setMessage('Sayfa yayına alındı.');
    } catch {
      setError('Sayfa yayınlanamadı.');
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
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Pages</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Çok dilli sayfa içeriklerini, SEO alanlarını ve anasayfa bloklarını
              API payload görmeden yönetin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditor(createEmptyEditor());
              setError('');
              setMessage('');
            }}
            className="h-10 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-800 transition hover:border-gray-500"
          >
            Yeni sayfa
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
            {loading ? <p>Yükleniyor...</p> : null}
            {!loading && items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                Henüz sayfa yok. İlk sayfayı sağdaki formdan oluşturun.
              </div>
            ) : null}

            {items.map((page) => {
              const translation = getPrimaryTranslation(page);
              const active = page.id === editor.id;

              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => {
                    setEditor(pageToEditor(page));
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
                      {page.pageType}
                    </span>
                    <StatusBadge status={page.status} active={active} />
                  </div>
                  <div className="mt-3 font-semibold">
                    {translation?.title || 'Başlıksız sayfa'}
                  </div>
                  <div
                    className={`mt-1 text-sm ${
                      active ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    /{translation?.slug || 'slug-yok'}
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
                  Page type
                </span>
                <select
                  value={editor.pageType}
                  onChange={(event) =>
                    setEditor((current) => ({
                      ...current,
                      pageType: event.target.value as PageType,
                    }))
                  }
                  className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm"
                >
                  {PAGE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

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

              <div className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">
                  Current record
                </span>
                <div className="flex h-11 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">
                  {selectedPage?.id ?? 'Yeni kayıt'}
                </div>
              </div>
            </div>

            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  Translations
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  En az bir dilde title ve slug zorunlu. Public sayfalar bu
                  değerlerle yayınlanır.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {LOCALES.map((locale) => {
                  const translation = editor.translations[locale];

                  return (
                    <div
                      key={locale}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <h3 className="font-semibold text-gray-950">{locale}</h3>
                      <div className="mt-4 grid gap-3">
                        <TextField
                          label="Title"
                          value={translation.title}
                          onChange={(value) =>
                            updateTranslation(locale, 'title', value, setEditor)
                          }
                        />
                        <TextField
                          label="Slug"
                          value={translation.slug}
                          onChange={(value) =>
                            updateTranslation(locale, 'slug', value, setEditor)
                          }
                        />
                        <TextArea
                          label="Summary"
                          value={translation.summary}
                          onChange={(value) =>
                            updateTranslation(
                              locale,
                              'summary',
                              value,
                              setEditor,
                            )
                          }
                        />
                        <TextField
                          label="SEO title"
                          value={translation.seoTitle}
                          onChange={(value) =>
                            updateTranslation(
                              locale,
                              'seoTitle',
                              value,
                              setEditor,
                            )
                          }
                        />
                        <TextArea
                          label="SEO description"
                          value={translation.seoDescription}
                          onChange={(value) =>
                            updateTranslation(
                              locale,
                              'seoDescription',
                              value,
                              setEditor,
                            )
                          }
                        />
                        <TextField
                          label="Canonical URL"
                          value={translation.canonicalUrl}
                          onChange={(value) =>
                            updateTranslation(
                              locale,
                              'canonicalUrl',
                              value,
                              setEditor,
                            )
                          }
                        />
                        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                          <CheckboxField
                            checked={translation.robotsIndex}
                            label="Index"
                            onChange={(value) =>
                              updateTranslation(
                                locale,
                                'robotsIndex',
                                value,
                                setEditor,
                              )
                            }
                          />
                          <CheckboxField
                            checked={translation.robotsFollow}
                            label="Follow"
                            onChange={(value) =>
                              updateTranslation(
                                locale,
                                'robotsFollow',
                                value,
                                setEditor,
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-950">
                    Content blocks
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Blok konfigürasyonu geçerli JSON olmalı; public anasayfa
                    title, summary, text gibi alanları kartlara çevirir.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditor((current) => ({
                      ...current,
                      blocks: [
                        ...current.blocks,
                        createEditorBlock(current.blocks.length),
                      ],
                    }))
                  }
                  className="h-10 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-800 transition hover:border-gray-500"
                >
                  Blok ekle
                </button>
              </div>

              <div className="space-y-4">
                {editor.blocks.map((block, index) => (
                  <div
                    key={block.localId}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
                      <TextField
                        label="Block type"
                        value={block.type}
                        onChange={(value) =>
                          updateBlock(index, { type: value }, setEditor)
                        }
                      />
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-gray-700">
                          Sort
                        </span>
                        <input
                          type="number"
                          value={block.sortOrder}
                          onChange={(event) =>
                            updateBlock(
                              index,
                              { sortOrder: Number(event.target.value) },
                              setEditor,
                            )
                          }
                          className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditor((current) => ({
                            ...current,
                            blocks: current.blocks.filter(
                              (_, blockIndex) => blockIndex !== index,
                            ),
                          }))
                        }
                        className="h-10 self-end rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Sil
                      </button>
                    </div>
                    <TextArea
                      label="Config JSON"
                      value={block.configJsonText}
                      minRows={8}
                      onChange={(value) =>
                        updateBlock(
                          index,
                          { configJsonText: value },
                          setEditor,
                        )
                      }
                    />
                  </div>
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
                Yayına al
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-11 rounded-md bg-gray-950 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedAdmin>
  );
}

function createEmptyEditor(): EditorState {
  return {
    blocks: [createEditorBlock(0)],
    pageType: 'STANDARD',
    status: 'DRAFT',
    translations: {
      EN: createEmptyTranslation(),
      TR: createEmptyTranslation(),
    },
  };
}

function createEmptyTranslation(): EditorTranslation {
  return {
    canonicalUrl: '',
    robotsFollow: true,
    robotsIndex: true,
    seoDescription: '',
    seoTitle: '',
    slug: '',
    summary: '',
    title: '',
  };
}

function createEditorBlock(index: number): EditorBlock {
  return {
    configJsonText: '{\n  "title": "",\n  "summary": ""\n}',
    localId: `block-${Date.now()}-${index}`,
    sortOrder: index,
    type: 'content',
  };
}

function pageToEditor(page: PageItem): EditorState {
  const translations = {
    EN: createEmptyTranslation(),
    TR: createEmptyTranslation(),
  };

  for (const locale of LOCALES) {
    const translation = page.translations.find((item) => item.locale === locale);
    if (!translation) continue;

    translations[locale] = {
      canonicalUrl: translation.canonicalUrl ?? '',
      robotsFollow: translation.robotsFollow ?? true,
      robotsIndex: translation.robotsIndex ?? true,
      seoDescription: translation.seoDescription ?? '',
      seoTitle: translation.seoTitle ?? '',
      slug: translation.slug ?? '',
      summary: translation.summary ?? '',
      title: translation.title ?? '',
    };
  }

  return {
    blocks:
      page.blocks.length > 0
        ? page.blocks.map((block, index) => ({
            configJsonText: JSON.stringify(block.configJson ?? {}, null, 2),
            localId: block.id ?? `block-${index}`,
            sortOrder: block.sortOrder,
            type: block.type,
          }))
        : [createEditorBlock(0)],
    id: page.id,
    pageType: page.pageType,
    status: page.status,
    translations,
  };
}

function buildPayload(editor: EditorState): PagePayload {
  const translations: PagePayload['translations'] = [];

  for (const locale of LOCALES) {
    const translation = editor.translations[locale];
    const hasContent =
      Boolean(translation.title.trim()) ||
      Boolean(translation.slug.trim()) ||
      Boolean(translation.summary.trim());

    if (!hasContent) continue;
    if (!translation.title.trim() || !translation.slug.trim()) {
      throw new Error(`${locale} için title ve slug birlikte doldurulmalı.`);
    }

    translations.push({
      canonicalUrl: optionalString(translation.canonicalUrl),
      locale,
      robotsFollow: translation.robotsFollow,
      robotsIndex: translation.robotsIndex,
      seoDescription: optionalString(translation.seoDescription),
      seoTitle: optionalString(translation.seoTitle),
      slug: translation.slug.trim(),
      summary: optionalString(translation.summary),
      title: translation.title.trim(),
    });
  }

  if (translations.length === 0) {
    throw new Error('En az bir çeviri ekleyin.');
  }

  const blocks = editor.blocks
    .filter((block) => block.type.trim())
    .map((block, index) => {
      let configJson: unknown;

      try {
        configJson = block.configJsonText.trim()
          ? JSON.parse(block.configJsonText)
          : {};
      } catch {
        throw new Error(`${index + 1}. blok JSON formatı geçersiz.`);
      }

      return {
        configJson,
        sortOrder: Number.isFinite(block.sortOrder) ? block.sortOrder : index,
        type: block.type.trim(),
      };
    });

  return {
    blocks,
    pageType: editor.pageType,
    status: editor.status,
    translations,
  };
}

function optionalString(value: string) {
  return value.trim() || undefined;
}

function getPrimaryTranslation(page: PageItem) {
  return (
    page.translations.find((translation) => translation.locale === 'TR') ??
    page.translations.find((translation) => translation.locale === 'EN') ??
    page.translations[0]
  );
}

function updateTranslation<K extends keyof EditorTranslation>(
  locale: Locale,
  field: K,
  value: EditorTranslation[K],
  setEditor: (updater: (current: EditorState) => EditorState) => void,
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

function updateBlock(
  index: number,
  patch: Partial<EditorBlock>,
  setEditor: (updater: (current: EditorState) => EditorState) => void,
) {
  setEditor((current) => ({
    ...current,
    blocks: current.blocks.map((block, blockIndex) =>
      blockIndex === index ? { ...block, ...patch } : block,
    ),
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
  minRows = 3,
  onChange,
  value,
}: {
  label: string;
  minRows?: number;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="mt-3 block space-y-2">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <textarea
        value={value}
        rows={minRows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm leading-6"
      />
    </label>
  );
}

function CheckboxField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-gray-300"
      />
      <span>{label}</span>
    </label>
  );
}
