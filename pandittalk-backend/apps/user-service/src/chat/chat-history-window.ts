/** Newest-first query results become oldest-first for the transcript. */
export function chronologicalWindow<T>(
  newestFirst: T[],
  lastKeyPresent: boolean,
): { items: T[]; hasMore: boolean } {
  return { items: [...newestFirst].reverse(), hasMore: lastKeyPresent };
}
