export function getPublicSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_SITE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  return 'https://pandittalk.com';
}

export function articlePublicUrl(slug: string): string {
  return `${getPublicSiteUrl()}/articles/${encodeURIComponent(slug)}`;
}
