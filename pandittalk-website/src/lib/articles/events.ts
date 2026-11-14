import { API_BASE } from './site';

export type ArticleEventType = 'view' | 'read' | 'cta_click';

export function recordArticleEvent(slug: string, type: ArticleEventType): void {
  if (typeof window === 'undefined' || !slug) return;
  const key = `pt-event:${type}:${slug}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  void fetch(`${API_BASE}/articles/${encodeURIComponent(slug)}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, source: 'web' }),
    keepalive: true,
  }).catch(() => {
    sessionStorage.removeItem(key);
  });
}
