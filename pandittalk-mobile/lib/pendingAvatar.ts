/** A photo still on the device has not been saved with the profile yet. */
export function isPendingAvatarUri(uri: string | null | undefined): boolean {
  if (!uri) return false;
  const trimmed = uri.trim();
  if (!trimmed) return false;
  return !/^https?:\/\//i.test(trimmed);
}
