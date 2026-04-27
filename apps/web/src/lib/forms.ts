export type AppLocale = 'TR' | 'EN';
export type FormType = 'CONTACT' | 'DEMO_REQUEST';
export type FieldType =
  | 'TEXT'
  | 'EMAIL'
  | 'TEXTAREA'
  | 'SELECT'
  | 'CHECKBOX'
  | 'PHONE';

export type PublicFormField = {
  fieldType: FieldType;
  id: string;
  isRequired: boolean;
  label: string;
  name: string;
  optionsJson?: unknown;
  sortOrder: number;
};

export type PublicForm = {
  fields: PublicFormField[];
  formType: FormType;
  id: string;
  isActive: boolean;
  name: string;
  successMessage?: string | null;
};

export type PublicFormSubmissionPayload = {
  consentGiven: boolean;
  honeypot?: string;
  locale: AppLocale;
  payloadJson: Record<string, unknown>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getPublicForm(formId: string) {
  const res = await fetch(`${API_BASE}/public/forms/${formId}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch form');
  }

  return (await res.json()) as PublicForm;
}

export async function getPublicFormByType(formType: FormType) {
  const res = await fetch(`${API_BASE}/public/forms/type/${formType}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch form');
  }

  return (await res.json()) as PublicForm;
}

export async function submitPublicForm(
  formId: string,
  payload: PublicFormSubmissionPayload,
) {
  const res = await fetch(`${API_BASE}/public/forms/${formId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to submit form');
  }

  return res.json() as Promise<unknown>;
}
