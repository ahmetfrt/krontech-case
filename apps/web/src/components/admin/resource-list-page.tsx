'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/api';
import { getAdminToken } from '@/lib/admin/auth';
import { ProtectedAdmin } from './protected-admin';

export function ResourceListPage({
  title,
  endpoint,
}: {
  title: string;
  endpoint: string;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = getAdminToken();
        const data = await adminFetch(endpoint, token);
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
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{title}</h1>

        {loading ? <p>Yükleniyor...</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border p-4">
              <pre className="whitespace-pre-wrap text-sm">
                {JSON.stringify(item, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </ProtectedAdmin>
  );
}