'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/api';
import { getAdminToken } from '@/lib/admin/auth';
import { ProtectedAdmin } from './protected-admin';

type AuditLog = {
  action: string;
  createdAt: string;
  entityId?: string | null;
  entityType: string;
  id: string;
  metaJson?: unknown;
  user?: {
    email: string;
    name: string;
    role?: {
      name: string;
    } | null;
  } | null;
};

export function AuditLogPage() {
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const token = getAdminToken();
      const data = await adminFetch<AuditLog[]>('/audit-logs?take=150', token);
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setError('Audit logs could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  return (
    <ProtectedAdmin>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
              Operations
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Audit Logs</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Review CMS actions with user, entity and metadata context.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadLogs()}
            className="h-10 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-800 transition hover:border-gray-500"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.14em] text-gray-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-gray-600" colSpan={5}>
                    Loading audit logs...
                  </td>
                </tr>
              ) : null}
              {!loading && logs.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-gray-600" colSpan={5}>
                    No audit log entries yet.
                  </td>
                </tr>
              ) : null}
              {logs.map((log) => (
                <tr key={log.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 font-semibold text-gray-950">
                    {log.action}
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    <div>{log.entityType}</div>
                    {log.entityId ? (
                      <div className="mt-1 font-mono text-xs text-gray-500">
                        {log.entityId}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    <div>{log.user?.name ?? 'Unknown'}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {log.user?.email ?? 'No email'} - {log.user?.role?.name ?? 'No role'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <pre className="max-w-sm overflow-auto rounded-md bg-gray-50 p-2 text-xs leading-5 text-gray-700">
                      {JSON.stringify(log.metaJson ?? {}, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedAdmin>
  );
}
