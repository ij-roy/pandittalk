const USER_AVATAR_KEY_RE = /^avatars\/users\/([^/]+)\.jpg$/;

export function stripCacheBuster(url: string): string {
  const q = url.indexOf('?');
  return q === -1 ? url : url.slice(0, q);
}

export function parseUserIdFromAvatarObjectKey(key: string): string | null {
  const match = USER_AVATAR_KEY_RE.exec(key);
  return match?.[1] ?? null;
}

export function localAvatarKeyFromUrl(
  url: string | null | undefined,
  publicBaseUrl: string,
): string | null {
  if (!url?.trim()) return null;

  const base = stripCacheBuster(url.trim());
  const prefix = `${publicBaseUrl.replace(/\/$/, '')}/`;
  if (!base.startsWith(prefix)) return null;

  return base.slice(prefix.length);
}
