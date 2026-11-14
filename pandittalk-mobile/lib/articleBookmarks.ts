export const BOOKMARK_LIMIT = 20;

export function bookmarkLabel(saved: boolean): string {
  return saved ? 'Saved on this phone' : 'Save to read later';
}

export function toggleBookmark<T extends { slug: string }>(saved: T[], article: T): T[] {
  const slug = article.slug.trim();
  if (!slug) return saved;
  if (saved.some((item) => item.slug === slug)) {
    return saved.filter((item) => item.slug !== slug);
  }
  return [article, ...saved.filter((item) => item.slug !== slug)].slice(0, BOOKMARK_LIMIT);
}

export function findBookmark<T extends { slug: string }>(saved: T[], slug: string): T | null {
  return saved.find((item) => item.slug === slug.trim()) ?? null;
}
