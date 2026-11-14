export function mergeEarlierMessages<T extends { id: string }>(
  earlier: T[],
  current: T[],
): T[] {
  const seen = new Set(current.map((message) => message.id));
  const fresh = earlier.filter((message) => !seen.has(message.id));
  return [...fresh, ...current];
}

export function historyHasMore(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  return (payload as { hasMore?: unknown }).hasMore === true;
}
