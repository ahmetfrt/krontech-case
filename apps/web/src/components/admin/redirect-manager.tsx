'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/api';
import { getAdminToken } from '@/lib/admin/auth';
import { ProtectedAdmin } from './protected-admin';

type RedirectRule = {
  createdAt?: string;
  id: string;
  isActive: boolean;
  sourcePath: string;
  statusCode: number;
  targetPath: string;
  updatedAt?: string;
};

type EditorState = {
  id?: string;
  isActive: boolean;
  sourcePath: string;
  statusCode: string;
  targetPath: string;
};

function emptyEditor(): EditorState {
  return {
    isActive: true,
    sourcePath: '',
    statusCode: '301',
    targetPath: '',
  };
}

export function RedirectManager() {
  const [editor, setEditor] = useState<EditorState>(() => emptyEditor());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [rules, setRules] = useState<RedirectRule[]>([]);
  const [saving, setSaving] = useState(false);

  const loadRules = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const token = getAdminToken();
      const data = await adminFetch<RedirectRule[]>('/redirects', token);
      setRules(Array.isArray(data) ? data : []);
    } catch {
      setError('Redirect rules could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const statusCode = Number(editor.statusCode);

      if (!editor.sourcePath.trim() || !editor.targetPath.trim()) {
        throw new Error('Source and target paths are required.');
      }

      if (!Number.isInteger(statusCode) || statusCode < 300 || statusCode > 399) {
        throw new Error('Status code must be a 3xx redirect code.');
      }

      const payload = {
        isActive: editor.isActive,
        sourcePath: editor.sourcePath.trim(),
        statusCode,
        targetPath: editor.targetPath.trim(),
      };
      const token = getAdminToken();
      const saved = editor.id
        ? await adminFetch<RedirectRule>(`/redirects/${editor.id}`, token, {
            body: JSON.stringify(payload),
            method: 'PATCH',
          })
        : await adminFetch<RedirectRule>('/redirects', token, {
            body: JSON.stringify(payload),
            method: 'POST',
          });

      setEditor(ruleToEditor(saved));
      await loadRules();
      setMessage('Redirect rule saved.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Redirect rule could not be saved.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ruleId: string) {
    setError('');
    setMessage('');

    try {
      const token = getAdminToken();
      await adminFetch<RedirectRule>(`/redirects/${ruleId}`, token, {
        method: 'DELETE',
      });
      if (editor.id === ruleId) {
        setEditor(emptyEditor());
      }
      await loadRules();
      setMessage('Redirect rule deleted.');
    } catch {
      setError('Redirect rule could not be deleted.');
    }
  }

  return (
    <ProtectedAdmin>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
              Operations
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Redirects</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Maintain legacy URL redirects for SEO-safe site transitions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditor(emptyEditor());
              setError('');
              setMessage('');
            }}
            className="h-10 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-800 transition hover:border-gray-500"
          >
            New redirect
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

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <form
            onSubmit={handleSave}
            className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <TextField
              label="Source path"
              value={editor.sourcePath}
              onChange={(value) =>
                setEditor((current) => ({ ...current, sourcePath: value }))
              }
            />
            <TextField
              label="Target path"
              value={editor.targetPath}
              onChange={(value) =>
                setEditor((current) => ({ ...current, targetPath: value }))
              }
            />
            <TextField
              label="Status code"
              value={editor.statusCode}
              onChange={(value) =>
                setEditor((current) => ({ ...current, statusCode: value }))
              }
            />
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={editor.isActive}
                onChange={(event) =>
                  setEditor((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="size-4 rounded border-gray-300"
              />
              <span>Active</span>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="h-11 w-full rounded-md bg-gray-950 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save redirect'}
            </button>
          </form>

          <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-semibold text-gray-950">Rules</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <p className="p-5 text-sm text-gray-600">Loading redirects...</p>
              ) : null}
              {!loading && rules.length === 0 ? (
                <p className="p-5 text-sm text-gray-600">
                  No redirect rules yet.
                </p>
              ) : null}
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="grid gap-3 p-5 lg:grid-cols-[1fr_auto] lg:items-center"
                >
                  <button
                    type="button"
                    onClick={() => setEditor(ruleToEditor(rule))}
                    className="text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-950">
                        {rule.sourcePath}
                      </span>
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                        {rule.statusCode}
                      </span>
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-bold ${
                          rule.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {rule.targetPath}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(rule.id)}
                    className="h-9 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ProtectedAdmin>
  );
}

function ruleToEditor(rule: RedirectRule): EditorState {
  return {
    id: rule.id,
    isActive: rule.isActive,
    sourcePath: rule.sourcePath,
    statusCode: String(rule.statusCode),
    targetPath: rule.targetPath,
  };
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
