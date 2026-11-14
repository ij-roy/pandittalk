export type MenuSearchItem = {
  label: string;
  keywords?: string;
};

export function filterMenuDestinations<T extends MenuSearchItem>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const haystack = `${item.label} ${item.keywords ?? ''}`.toLowerCase();
    return haystack.includes(q);
  });
}
