export function shouldKeepScreenAwake(
  format: 'audio' | 'video',
  userPrefersAwake: boolean,
): boolean {
  if (format === 'video') return true;
  return userPrefersAwake;
}
