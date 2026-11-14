import type { ArticleCategory } from '@/lib/articlesApi';

/** Pinned Unsplash photos — stable direct URLs per category. */
export const ARTICLE_COVER_IMAGES: Record<ArticleCategory, string> = {
  astrology:
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=400&fit=crop',
  spirituality:
    'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=400&fit=crop',
  vastu:
    'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&h=400&fit=crop',
  numerology:
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop',
  tarot:
    'https://images.unsplash.com/photo-1509245853830-fb36a1f1f1c1?w=800&h=400&fit=crop',
  palmistry:
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=400&fit=crop',
  relationships:
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&h=400&fit=crop',
  career:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
};

const DEAD_URL_PATTERNS = ['source.unsplash.com', 'images.pandittalk.com/articles/'];

export function isDeadArticleCoverUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  return DEAD_URL_PATTERNS.some((pattern) => trimmed.includes(pattern));
}

export function resolveArticleCoverUrl(
  url: string,
  category: ArticleCategory,
): string {
  if (!isDeadArticleCoverUrl(url)) return url.trim();
  return ARTICLE_COVER_IMAGES[category] ?? ARTICLE_COVER_IMAGES.astrology;
}
