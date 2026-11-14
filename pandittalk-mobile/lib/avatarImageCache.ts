export const AVATAR_IMAGE_CACHE = 'memory-disk' as const;

export function avatarImageSource(url: string): { uri: string; cacheKey: string } | null {
  const uri = url.trim();
  if (!uri) return null;
  return { uri, cacheKey: uri };
}

export function avatarUrls(urls: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const uri = raw?.trim() ?? '';
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    out.push(uri);
  }
  return out;
}
