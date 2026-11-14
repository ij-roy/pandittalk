import type { ArticleCategory } from '@/lib/articlesApi';

export type ArticleCategoryFilter = ArticleCategory | 'all';

export const ARTICLE_CATEGORY_TABS: { id: ArticleCategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'astrology', label: 'Astrology' },
  { id: 'spirituality', label: 'Spirituality' },
  { id: 'vastu', label: 'Vastu' },
  { id: 'numerology', label: 'Numerology' },
  { id: 'tarot', label: 'Tarot' },
  { id: 'palmistry', label: 'Palmistry' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'career', label: 'Career' },
];

export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, string> = {
  astrology: 'Astrology',
  spirituality: 'Spirituality',
  vastu: 'Vastu',
  numerology: 'Numerology',
  tarot: 'Tarot',
  palmistry: 'Palmistry',
  relationships: 'Relationships',
  career: 'Career',
};

export function articleCategoryLabel(category: ArticleCategory): string {
  return ARTICLE_CATEGORY_LABELS[category] ?? category;
}
