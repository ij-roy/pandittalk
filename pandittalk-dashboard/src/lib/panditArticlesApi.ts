import { api } from './api';

export type ArticleCategory =
  | 'astrology'
  | 'spirituality'
  | 'vastu'
  | 'numerology'
  | 'tarot'
  | 'palmistry'
  | 'relationships'
  | 'career';

export type ArticleStatus = 'draft' | 'scheduled' | 'published' | 'unpublished';
export type ArticleLanguage = 'hi' | 'en' | 'mixed';

export const ARTICLE_CATEGORIES: { id: ArticleCategory; label: string }[] = [
  { id: 'astrology', label: 'Astrology' },
  { id: 'spirituality', label: 'Spirituality' },
  { id: 'vastu', label: 'Vastu' },
  { id: 'numerology', label: 'Numerology' },
  { id: 'tarot', label: 'Tarot' },
  { id: 'palmistry', label: 'Palmistry' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'career', label: 'Career' },
];

export type PanditArticle = {
  id: string;
  title: string;
  slug: string;
  category: ArticleCategory;
  author: string;
  authorPanditId: string | null;
  status: ArticleStatus;
  language: ArticleLanguage;
  coverImageUrl: string;
  coverAlt: string | null;
  excerpt: string;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  readTimeMinutes: number;
  publishedAt: string;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ArticleStats = {
  totals: { views: number; reads: number; ctaClicks: number };
  bySource: { app: number; web: number };
  series: Array<{ date: string; views: number; reads: number; ctaClicks: number }>;
  topArticles: Array<{ id: string; title: string; slug: string; views: number }>;
};

export async function listMyArticles(params?: {
  status?: ArticleStatus;
  category?: ArticleCategory;
  search?: string;
}): Promise<{ articles: PanditArticle[]; total: number }> {
  const { data } = await api.get<{ articles: PanditArticle[]; total: number }>(
    '/pandit/articles',
    { params },
  );
  return data;
}

export async function getMyArticle(id: string): Promise<PanditArticle> {
  const { data } = await api.get<PanditArticle>(`/pandit/articles/${id}`);
  return data;
}

export async function createMyArticle(body: {
  title: string;
  content?: string;
  category?: ArticleCategory;
}): Promise<PanditArticle> {
  const { data } = await api.post<PanditArticle>('/pandit/articles', body);
  return data;
}

export async function updateMyArticle(
  id: string,
  body: Partial<
    Pick<
      PanditArticle,
      | 'title'
      | 'slug'
      | 'category'
      | 'content'
      | 'excerpt'
      | 'coverImageUrl'
      | 'coverAlt'
      | 'seoTitle'
      | 'seoDescription'
      | 'language'
    >
  >,
): Promise<PanditArticle> {
  const { data } = await api.patch<PanditArticle>(`/pandit/articles/${id}`, body);
  return data;
}

export async function publishMyArticle(
  id: string,
  scheduledAt?: string,
): Promise<PanditArticle> {
  const { data } = await api.post<PanditArticle>(`/pandit/articles/${id}/publish`, {
    ...(scheduledAt ? { scheduledAt } : {}),
  });
  return data;
}

export async function unpublishMyArticle(id: string): Promise<PanditArticle> {
  const { data } = await api.post<PanditArticle>(`/pandit/articles/${id}/unpublish`);
  return data;
}

export async function deleteMyArticle(id: string): Promise<void> {
  await api.delete(`/pandit/articles/${id}`);
}

export async function uploadCover(
  id: string,
  file: File,
): Promise<PanditArticle> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<PanditArticle>(
    `/pandit/articles/${id}/cover`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function getArticleStats(): Promise<ArticleStats> {
  const { data } = await api.get<ArticleStats>('/pandit/articles/stats');
  return data;
}
