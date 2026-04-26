export function resolveMediaUrl(publicUrl?: string | null) {
  if (!publicUrl) return '';
  return publicUrl;
}

export function fallbackImage() {
  return 'https://placehold.co/1200x800?text=No+Image';
}