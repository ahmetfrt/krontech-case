export const ADMIN_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function adminFetch<T = unknown>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  const isFormData =
    typeof FormData !== 'undefined' && options?.body instanceof FormData;

  const res = await fetch(`${ADMIN_API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
}
