export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

export function htmlLang(language: 'hi' | 'en' | 'mixed'): string {
  return language === 'en' ? 'en' : 'hi';
}

/** Prefer API minutes; fall back to a word-count estimate so cards never show "0 min". */
export function formatReadTime(minutes?: number | null, content?: string | null): string {
  const fromApi = typeof minutes === 'number' && Number.isFinite(minutes) ? Math.round(minutes) : 0;
  if (fromApi >= 1) return `${fromApi} min read`;
  if (content) {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const estimated = Math.max(1, Math.round(words / 200));
    return `About ${estimated} min read`;
  }
  return 'Quick read';
}
