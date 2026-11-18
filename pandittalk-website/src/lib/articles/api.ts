import { API_BASE } from './site';

export type ArticleCategory =
  | 'astrology'
  | 'spirituality'
  | 'vastu'
  | 'numerology'
  | 'tarot'
  | 'palmistry'
  | 'relationships'
  | 'career';

export type PublicAuthor = {
  id: string;
  name: string;
  headline: string;
  imageUrl: string | null;
  specialty: string;
};

export type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  category: ArticleCategory;
  author: string;
  authorPanditId: string | null;
  authorProfile: PublicAuthor | null;
  language: 'hi' | 'en' | 'mixed';
  coverImageUrl: string;
  coverAlt: string | null;
  excerpt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  readTimeMinutes: number;
  publishedAt: string;
  updatedAt: string;
};

export type ArticleDetail = ArticleListItem & { content: string };

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  astrology: 'Astrology',
  spirituality: 'Spirituality',
  vastu: 'Vastu',
  numerology: 'Numerology',
  tarot: 'Tarot',
  palmistry: 'Palmistry',
  relationships: 'Relationships',
  career: 'Career',
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as ArticleCategory[];

export function isCategory(value: string | undefined | null): value is ArticleCategory {
  return !!value && value in CATEGORY_LABELS;
}

async function getJson<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchArticles(options?: {
  limit?: number;
  category?: string;
  search?: string;
}): Promise<ArticleListItem[]> {
  const params = new URLSearchParams();
  params.set('limit', String(options?.limit ?? 24));
  if (options?.category && isCategory(options.category)) {
    params.set('category', options.category);
  }
  if (options?.search?.trim()) {
    params.set('search', options.search.trim());
  }
  const body = await getJson<{ articles?: ArticleListItem[] }>(
    `/articles?${params.toString()}`,
  );
  return Array.isArray(body?.articles) ? body.articles : [];
}

export async function fetchArticle(slug: string): Promise<ArticleDetail | null> {
  return getJson<ArticleDetail>(`/articles/${encodeURIComponent(slug)}`);
}

export async function fetchSitemap(): Promise<
  Array<{ slug: string; updatedAt: string; publishedAt: string }>
> {
  const rows = await getJson<
    Array<{ slug: string; updatedAt: string; publishedAt: string }>
  >('/articles/sitemap', 300);
  return Array.isArray(rows) ? rows : [];
}

export async function fetchAuthor(panditId: string): Promise<{
  author: PublicAuthor;
  articles: ArticleListItem[];
} | null> {
  return getJson(`/articles/authors/${encodeURIComponent(panditId)}`);
}
