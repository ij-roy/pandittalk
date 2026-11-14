export const AVATAR_STORAGE = Symbol('AVATAR_STORAGE');

export const userAvatarObjectKey = (userId: string): string =>
  `avatars/users/${userId}.jpg`;

export const panditAvatarObjectKey = (panditId: string): string =>
  `avatars/pandits/${panditId}.jpg`;

export const panditAvatarCdnUrl = (
  cdnBaseUrl: string,
  panditId: string,
  cacheBuster?: string | number,
): string => {
  const base = `${cdnBaseUrl.replace(/\/$/, '')}/${panditAvatarObjectKey(panditId)}`;
  return cacheBuster != null ? `${base}?v=${cacheBuster}` : base;
};

export interface AvatarStorage {
  /** Persist avatar bytes; returns a public URL without cache-buster query params. */
  put(key: string, buffer: Buffer, contentType: string): Promise<string>;
  /** Remove the stored object. Key format depends on the provider. */
  delete(key: string): Promise<void>;
}
