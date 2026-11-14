export function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const candidate = err as { code?: string; name?: string };
  return (
    candidate.code === 'ERR_CANCELED' ||
    candidate.name === 'CanceledError' ||
    candidate.name === 'AbortError'
  );
}
