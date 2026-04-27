'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/api';
import { getAdminToken } from '@/lib/admin/auth';

type VersionPanelProps<T> = {
  endpoint: string;
  entityId?: string;
  onRestored: (entity: T) => void | Promise<void>;
};

type ContentVersion = {
  createdAt: string;
  id: string;
  note?: string | null;
  versionNo: number;
};

export function VersionPanel<T>({
  endpoint,
  entityId,
  onRestored,
}: VersionPanelProps<T>) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState('');
  const [versions, setVersions] = useState<ContentVersion[]>([]);

  const loadVersions = useCallback(async () => {
    if (!entityId) {
      setVersions([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = getAdminToken();
      const data = await adminFetch<ContentVersion[]>(
        `${endpoint}/${entityId}/versions`,
        token,
      );
      setVersions(Array.isArray(data) ? data : []);
    } catch {
      setError('Version history could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [endpoint, entityId]);

  useEffect(() => {
    void loadVersions();
  }, [loadVersions]);

  async function handleRestore(versionId: string) {
    if (!entityId) return;

    setRestoringId(versionId);
    setError('');

    try {
      const token = getAdminToken();
      const restored = await adminFetch<T>(`${endpoint}/${entityId}/restore`, token, {
        body: JSON.stringify({ versionId }),
        method: 'POST',
      });
      await onRestored(restored);
      await loadVersions();
    } catch {
      setError('Selected version could not be restored.');
    } finally {
      setRestoringId('');
    }
  }

  if (!entityId) {
    return null;
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-950">Versions</h2>
          <p className="mt-1 text-sm text-gray-600">
            Restore a saved snapshot when a content update needs to be rolled back.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadVersions()}
          className="h-9 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-800 transition hover:border-gray-500"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {loading ? <p className="text-sm text-gray-600">Loading versions...</p> : null}
        {!loading && versions.length === 0 ? (
          <p className="text-sm text-gray-600">No version snapshots yet.</p>
        ) : null}
        {versions.map((version) => (
          <div
            key={version.id}
            className="flex flex-col gap-3 rounded-md border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="text-sm font-bold text-gray-950">
                v{version.versionNo}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {new Date(version.createdAt).toLocaleString()}
              </div>
              {version.note ? (
                <p className="mt-1 text-sm text-gray-600">{version.note}</p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={Boolean(restoringId)}
              onClick={() => void handleRestore(version.id)}
              className="h-9 rounded-md border border-gray-300 px-3 text-sm font-bold text-gray-900 transition hover:border-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {restoringId === version.id ? 'Restoring...' : 'Restore'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
