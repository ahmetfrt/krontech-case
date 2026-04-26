'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
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
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = getAdminToken();
        const data = await adminFetch<MediaAsset[]>('/media', token);
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setError('Media verileri alınamadı.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <ProtectedAdmin>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Media</h1>

        {loading ? <p>Yükleniyor...</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map((item) => {
            const isImage = item.mimeType?.startsWith('image/');

            return (
              <article key={item.id} className="rounded-xl border p-4 space-y-3">
                {isImage ? (
                  <div className="overflow-hidden rounded-lg border">
                    <Image
                      src={item.publicUrl}
                      alt={item.fileName}
                      width={600}
                      height={400}
                      className="h-auto w-full object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border p-6 text-sm text-gray-500">
                    Önizleme yok
                  </div>
                )}

                <div>
                  <div className="font-medium">{item.fileName}</div>
                  <div className="text-sm text-gray-500">{item.mimeType}</div>
                </div>

                <a
                  href={item.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
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
