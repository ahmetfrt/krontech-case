export function resolveMediaUrl(publicUrl?: string | null) {
  if (!publicUrl) return '';
  return publicUrl;
}

export function fallbackImage() {
  return '/images/kron-product-fallback.webp';
}

export function resourceFallbackImage() {
  return '/images/kron-resource-library.webp';
}

export function blogFallbackImage() {
  return '/images/kron-blog-fallback.webp';
}
