export async function getPublicForm(formId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const res = await fetch(`${baseUrl}/public/forms/${formId}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch form');
  }

  return res.json();
}

export async function submitPublicForm(formId: string, payload: {
  locale: 'TR' | 'EN';
  payloadJson: Record<string, any>;
  consentGiven: boolean;
  honeypot?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const res = await fetch(`${baseUrl}/public/forms/${formId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to submit form');
  }

  return res.json();
}