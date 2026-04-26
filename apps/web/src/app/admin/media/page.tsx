'use client';

import Image from 'next/image';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ProtectedAdmin } from '@/components/admin/protected-admin';
import { adminFetch } from '@/lib/admin/api';
import { getAdminToken } from '@/lib/admin/auth';

type MediaAsset = {
  fileName: string;
  id: string;
  mimeType?: string;
  publicUrl: string;
};

export default function AdminMediaPage() {
  const [error, setError] = useState('');
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const token = getAdminToken();
      const data = await adminFetch<MediaAsset[]>('/media', token);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError('Media verileri alınamadı.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setError('Yüklenecek dosyayı seçin.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = getAdminToken();
      await adminFetch<MediaAsset>('/media/upload', token, {
        body: formData,
        method: 'POST',
      });

      setSelectedFile(null);
      event.currentTarget.reset();
      await load();
    } catch {
      setError('Dosya yüklenemedi.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <ProtectedAdmin>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
            CMS
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-950">Media</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Upload images or documents to MinIO and reuse them from product,
            blog and resource editors.
          </p>
        </div>

        <form
          onSubmit={handleUpload}
          className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto]"
        >
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">
              Upload file
            </span>
            <input
              type="file"
              onChange={(event) =>
                setSelectedFile(event.target.files?.[0] ?? null)
              }
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={uploading}
            className="h-11 self-end rounded-md bg-gray-950 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>

        {loading ? <p>Yükleniyor...</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}

        {!loading && !error && items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-600">
            Henüz medya kaydı yok.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map((item) => {
            const isImage = item.mimeType?.startsWith('image/');

            return (
              <article
                key={item.id}
                className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                {isImage ? (
                  <div className="aspect-[4/3] overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                    <Image
                      src={item.publicUrl}
                      alt={item.fileName}
                      width={600}
                      height={450}
                      className="h-full w-full object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="grid aspect-[4/3] place-items-center rounded-md border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                    Önizleme yok
                  </div>
                )}

                <div>
                  <div className="break-words font-medium text-gray-950">
                    {item.fileName}
                  </div>
                  <div className="text-sm text-gray-500">{item.mimeType}</div>
                </div>

                <a
                  href={item.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-semibold text-blue-600 underline"
                >
                  Dosyayı aç
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </ProtectedAdmin>
  );
}
