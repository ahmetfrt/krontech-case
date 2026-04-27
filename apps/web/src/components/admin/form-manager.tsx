'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ADMIN_API_BASE, adminFetch } from '@/lib/admin/api';
import { getAdminToken } from '@/lib/admin/auth';
import { ProtectedAdmin } from './protected-admin';

type FormType = 'CONTACT' | 'DEMO_REQUEST';
type FieldType = 'TEXT' | 'EMAIL' | 'TEXTAREA' | 'SELECT' | 'CHECKBOX' | 'PHONE';

type FormField = {
  fieldType: FieldType;
  id?: string;
  isRequired: boolean;
  label: string;
  name: string;
  optionsJson?: unknown;
  sortOrder: number;
};

type FormDefinition = {
  fields: FormField[];
  formType: FormType;
  id: string;
  isActive: boolean;
  name: string;
  successMessage?: string | null;
  webhookUrl?: string | null;
};

type Submission = {
  consentGiven: boolean;
  createdAt: string;
  id: string;
  locale: 'TR' | 'EN';
  payloadJson: Record<string, unknown>;
};

type EditorField = Omit<FormField, 'optionsJson'> & {
  localId: string;
  optionsText: string;
};

type EditorState = {
  fields: EditorField[];
  formType: FormType;
  id?: string;
  isActive: boolean;
  name: string;
  successMessage: string;
  webhookUrl: string;
};

const FORM_TYPES: FormType[] = ['CONTACT', 'DEMO_REQUEST'];
const FIELD_TYPES: FieldType[] = [
  'TEXT',
  'EMAIL',
  'TEXTAREA',
  'SELECT',
  'CHECKBOX',
  'PHONE',
];

export function FormManager() {
  const [editor, setEditor] = useState<EditorState>(() => createEmptyEditor());
  const [error, setError] = useState('');
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const selectedForm = useMemo(
    () => forms.find((form) => form.id === editor.id),
    [editor.id, forms],
  );

  const loadForms = useCallback(async () => {
    try {
      setError('');
      const token = getAdminToken();
      const data = await adminFetch<FormDefinition[]>('/forms', token);
      setForms(Array.isArray(data) ? data : []);
    } catch {
      setError('Forms could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubmissions = useCallback(async (formId: string) => {
    try {
      const token = getAdminToken();
      const data = await adminFetch<Submission[]>(
        `/forms/${formId}/submissions`,
        token,
      );
      setSubmissions(Array.isArray(data) ? data : []);
    } catch {
      setSubmissions([]);
    }
  }, []);

  useEffect(() => {
    void loadForms();
  }, [loadForms]);

  useEffect(() => {
    if (editor.id) {
      void loadSubmissions(editor.id);
    } else {
      setSubmissions([]);
    }
  }, [editor.id, loadSubmissions]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const payload = buildPayload(editor);
      const token = getAdminToken();
      const saved = editor.id
        ? await adminFetch<FormDefinition>(`/forms/${editor.id}`, token, {
            body: JSON.stringify(payload),
            method: 'PATCH',
          })
        : await adminFetch<FormDefinition>('/forms', token, {
            body: JSON.stringify(payload),
            method: 'POST',
          });

      setEditor(formToEditor(saved));
      await loadForms();
      await loadSubmissions(saved.id);
      setMessage('Form saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Form could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function handleExportCsv() {
    if (!editor.id) return;

    try {
      const token = getAdminToken();
      const res = await fetch(
        `${ADMIN_API_BASE}/forms/${editor.id}/submissions/export`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error('Export failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `form-${editor.id}-submissions.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Submissions could not be exported.');
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
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Forms</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Manage public form definitions, fields, submissions and CSV
              exports without editing code.
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
            New form
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
            {!loading && forms.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                No forms yet. Create the first form from the editor.
              </div>
            ) : null}

            {forms.map((form) => {
              const active = form.id === editor.id;

              return (
                <button
                  key={form.id}
                  type="button"
                  onClick={() => {
                    setEditor(formToEditor(form));
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
                      {form.formType}
                    </span>
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-bold ${
                        active
                          ? 'bg-white/10 text-white'
                          : form.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {form.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div className="mt-3 font-semibold">{form.name}</div>
                  <div
                    className={`mt-1 text-sm ${
                      active ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {form.fields.length} fields
                  </div>
                </button>
              );
            })}
          </aside>

          <div className="space-y-6">
            <form
              onSubmit={handleSave}
              className="space-y-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <TextField
                  label="Name"
                  value={editor.name}
                  onChange={(value) =>
                    setEditor((current) => ({ ...current, name: value }))
                  }
                />
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Form type
                  </span>
                  <select
                    value={editor.formType}
                    onChange={(event) =>
                      setEditor((current) => ({
                        ...current,
                        formType: event.target.value as FormType,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
                  >
                    {FORM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="inline-flex items-center gap-2 self-end pb-2 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={editor.isActive}
                    onChange={(event) =>
                      setEditor((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    className="size-4"
                  />
                  Active
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <TextArea
                  label="Success message"
                  value={editor.successMessage}
                  rows={3}
                  onChange={(value) =>
                    setEditor((current) => ({
                      ...current,
                      successMessage: value,
                    }))
                  }
                />
                <TextField
                  label="Webhook URL"
                  value={editor.webhookUrl}
                  onChange={(value) =>
                    setEditor((current) => ({ ...current, webhookUrl: value }))
                  }
                />
              </div>

              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-950">
                      Fields
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Select fields can use JSON array/object or one option per
                      line.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditor((current) => ({
                        ...current,
                        fields: [
                          ...current.fields,
                          createEditorField(current.fields.length),
                        ],
                      }))
                    }
                    className="h-10 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-800 transition hover:border-gray-500"
                  >
                    Add field
                  </button>
                </div>

                <div className="space-y-4">
                  {editor.fields.map((field, index) => (
                    <FieldEditor
                      key={field.localId}
                      field={field}
                      index={index}
                      onRemove={() =>
                        setEditor((current) => ({
                          ...current,
                          fields: current.fields.filter(
                            (_, fieldIndex) => fieldIndex !== index,
                          ),
                        }))
                      }
                      onUpdate={(patch) =>
                        setEditor((current) => ({
                          ...current,
                          fields: current.fields.map((item, fieldIndex) =>
                            fieldIndex === index ? { ...item, ...patch } : item,
                          ),
                        }))
                      }
                    />
                  ))}
                </div>
              </section>

              <div className="flex justify-end border-t border-gray-200 pt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 rounded-md bg-gray-950 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save form'}
                </button>
              </div>
            </form>

            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-950">
                    Submissions
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedForm
                      ? `${submissions.length} submissions for ${selectedForm.name}.`
                      : 'Select a saved form to view submissions.'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!editor.id || submissions.length === 0}
                  onClick={handleExportCsv}
                  className="h-10 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-800 transition hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Export CSV
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {submissions.map((submission) => (
                  <article
                    key={submission.id}
                    className="rounded-md border border-gray-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                      <span>{submission.locale}</span>
                      <span>{formatDate(submission.createdAt)}</span>
                    </div>
                    <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                      {Object.entries(submission.payloadJson).map(
                        ([key, value]) => (
                          <div key={key}>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {key}
                            </dt>
                            <dd className="mt-1 break-words text-gray-900">
                              {formatPayloadValue(value)}
                            </dd>
                          </div>
                        ),
                      )}
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </ProtectedAdmin>
  );
}

function FieldEditor({
  field,
  index,
  onRemove,
  onUpdate,
}: {
  field: EditorField;
  index: number;
  onRemove: () => void;
  onUpdate: (patch: Partial<EditorField>) => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_150px_90px_auto]">
        <TextField
          label="Name"
          value={field.name}
          onChange={(value) => onUpdate({ name: value })}
        />
        <TextField
          label="Label"
          value={field.label}
          onChange={(value) => onUpdate({ label: value })}
        />
        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Type</span>
          <select
            value={field.fieldType}
            onChange={(event) =>
              onUpdate({ fieldType: event.target.value as FieldType })
            }
            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
          >
            {FIELD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Sort</span>
          <input
            type="number"
            value={field.sortOrder}
            onChange={(event) =>
              onUpdate({ sortOrder: Number(event.target.value) || index })
            }
            className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="h-10 self-end rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        >
          Remove
        </button>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[auto_1fr]">
        <label className="inline-flex items-center gap-2 self-start pt-2 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={field.isRequired}
            onChange={(event) => onUpdate({ isRequired: event.target.checked })}
            className="size-4"
          />
          Required
        </label>
        <TextArea
          label="Options"
          value={field.optionsText}
          rows={3}
          onChange={(value) => onUpdate({ optionsText: value })}
        />
      </div>
    </div>
  );
}

function createEmptyEditor(): EditorState {
  return {
    fields: [
      createEditorField(0, {
        fieldType: 'TEXT',
        isRequired: true,
        label: 'First name',
        name: 'firstName',
      }),
      createEditorField(1, {
        fieldType: 'TEXT',
        isRequired: true,
        label: 'Last name',
        name: 'lastName',
      }),
      createEditorField(2, {
        fieldType: 'EMAIL',
        isRequired: true,
        label: 'Email',
        name: 'email',
      }),
      createEditorField(3, {
        fieldType: 'TEXT',
        isRequired: false,
        label: 'Company',
        name: 'company',
      }),
      createEditorField(4, {
        fieldType: 'PHONE',
        isRequired: false,
        label: 'Phone',
        name: 'phone',
      }),
      createEditorField(5, {
        fieldType: 'TEXTAREA',
        isRequired: true,
        label: 'Message',
        name: 'message',
      }),
      createEditorField(6, {
        fieldType: 'CHECKBOX',
        isRequired: true,
        label: 'I consent to being contacted about my request.',
        name: 'consent',
      }),
    ],
    formType: 'CONTACT',
    isActive: true,
    name: 'Contact Form',
    successMessage: 'Thank you. Your message has been received.',
    webhookUrl: '',
  };
}

function createEditorField(
  index: number,
  overrides?: Partial<EditorField>,
): EditorField {
  return {
    fieldType: 'TEXT',
    isRequired: false,
    label: '',
    localId: `field-${Date.now()}-${index}`,
    name: '',
    optionsText: '',
    sortOrder: index,
    ...overrides,
  };
}

function formToEditor(form: FormDefinition): EditorState {
  return {
    fields: form.fields.map((field, index) =>
      createEditorField(index, {
        ...field,
        optionsText: optionsToText(field.optionsJson),
      }),
    ),
    formType: form.formType,
    id: form.id,
    isActive: form.isActive,
    name: form.name,
    successMessage: form.successMessage ?? '',
    webhookUrl: form.webhookUrl ?? '',
  };
}

function buildPayload(editor: EditorState) {
  if (!editor.name.trim()) {
    throw new Error('Form name is required.');
  }

  if (editor.fields.length === 0) {
    throw new Error('At least one field is required.');
  }

  return {
    fields: editor.fields.map((field, index) => {
      if (!field.name.trim() || !field.label.trim()) {
        throw new Error('Every field needs a name and label.');
      }

      return {
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        label: field.label.trim(),
        name: field.name.trim(),
        optionsJson:
          field.fieldType === 'SELECT'
            ? parseOptions(field.optionsText)
            : undefined,
        sortOrder: Number.isFinite(field.sortOrder) ? field.sortOrder : index,
      };
    }),
    formType: editor.formType,
    isActive: editor.isActive,
    name: editor.name.trim(),
    successMessage: editor.successMessage.trim() || undefined,
    webhookUrl: editor.webhookUrl.trim() || undefined,
  };
}

function parseOptions(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (trimmedValue.startsWith('[') || trimmedValue.startsWith('{')) {
    try {
      return JSON.parse(trimmedValue) as unknown;
    } catch {
      throw new Error('Select options JSON is invalid.');
    }
  }

  return trimmedValue
    .split(/\r?\n|,/)
    .map((option) => option.trim())
    .filter(Boolean);
}

function optionsToText(value: unknown) {
  if (!value) return '';
  if (Array.isArray(value)) {
    return value
      .filter((option): option is string => typeof option === 'string')
      .join('\n');
  }

  return JSON.stringify(value, null, 2);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatPayloadValue(value: unknown) {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return JSON.stringify(value);
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
    <label className="block space-y-2">
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
