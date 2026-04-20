export const ADMIN_TOKEN_KEY = 'krontech_admin_token';

export function getAdminToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
}

export function setAdminToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}