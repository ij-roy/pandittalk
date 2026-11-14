import axios from 'axios';

import { resolveArticleCoverUrl } from '@/constants/articleCoverImages';
import { API_BASE } from '@/lib/authApi';

export type ArticleCategory =
  | 'astrology'
  | 'spirituality'
  | 'vastu'
  | 'numerology'
  | 'tarot'
  | 'palmistry'
  | 'relationships'
  | 'career';

export type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  category: ArticleCategory;
  author: string;
  coverImageUrl: string;
  excerpt: string;
  readTimeMinutes: number;
  publishedAt: string;
};

export type ArticleDetail = ArticleListItem & {
  content: string;
};

export type PaginatedArticles = {
  articles: ArticleListItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type FetchArticlesParams = {
  limit?: number;
  cursor?: string;
  category?: ArticleCategory;
  search?: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return fallback;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

const VALID_CATEGORIES = new Set<string>([
  'astrology',
  'spirituality',
  'vastu',
  'numerology',
  'tarot',
  'palmistry',
  'relationships',
  'career',
]);

function normalizeCategory(v: unknown): ArticleCategory {
  const key = typeof v === 'string' ? v.trim().toLowerCase() : '';
  if (VALID_CATEGORIES.has(key)) return key as ArticleCategory;
  return 'astrology';
}

export function normalizeArticleListItem(raw: unknown): ArticleListItem | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = str(o.id);
  const slug = str(o.slug);
  const title = str(o.title, 'Untitled');
  if (!id || !slug) return null;

  const category = normalizeCategory(o.category);
  const rawCover = str(o.coverImageUrl ?? o.cover_image_url);

  return {
    id,
    slug,
    title,
    category,
    author: str(o.author, 'PanditTalk'),
    coverImageUrl: resolveArticleCoverUrl(rawCover, category),
    excerpt: str(o.excerpt),
    readTimeMinutes: Math.max(1, Math.round(num(o.readTimeMinutes ?? o.read_time_minutes, 5))),
    publishedAt: str(o.publishedAt ?? o.published_at, new Date().toISOString()),
  };
}

function normalizeArticleDetail(raw: unknown): ArticleDetail | null {
  const base = normalizeArticleListItem(raw);
  if (!base) return null;
  const o = asRecord(raw);
  return {
    ...base,
    content: str(o?.content),
  };
}

export async function fetchArticles(
  params: FetchArticlesParams = {},
): Promise<PaginatedArticles> {
  const query: Record<string, string | number> = {};
  if (params.limit != null) query.limit = params.limit;
  if (params.cursor) query.cursor = params.cursor;
  if (params.category) query.category = params.category;
  if (params.search?.trim()) query.search = params.search.trim();

  const res = await axios.get(`${API_BASE}/articles`, { params: query });
  const body = asRecord(res.data) ?? {};
  const rows = Array.isArray(body.articles) ? body.articles : [];
  const articles = rows.map(normalizeArticleListItem).filter(Boolean) as ArticleListItem[];

  return {
    articles,
    nextCursor: typeof body.nextCursor === 'string' ? body.nextCursor : null,
    hasMore: Boolean(body.hasMore),
  };
}

export async function fetchArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  const res = await axios.get(`${API_BASE}/articles/${encodeURIComponent(slug)}`);
  const body = asRecord(res.data);
  const inner = body?.data ?? body?.article ?? res.data;
  return normalizeArticleDetail(inner);
}

export async function recordArticleEvent(
  slug: string,
  type: 'view' | 'read' | 'cta_click',
): Promise<void> {
  try {
    await axios.post(`${API_BASE}/articles/${encodeURIComponent(slug)}/events`, {
      type,
      source: 'app',
    });
  } catch {
    // Analytics must never block reading.
  }
}
