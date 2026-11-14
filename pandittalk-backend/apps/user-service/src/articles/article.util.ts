import { ArticleCategory, ArticleLanguage, ArticleStatus } from '@prisma/client';

export const CATEGORY_COVER_IMAGES: Record<ArticleCategory, string> = {
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

export function coverImageForCategory(category: ArticleCategory): string {
  return CATEGORY_COVER_IMAGES[category] ?? CATEGORY_COVER_IMAGES.spirituality;
}

export function slugifyTitle(title: string): string {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return ascii;
}

export function estimateReadTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function excerptFromContent(content: string, maxLength = 150): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 3).trim()}...`;
}

export function detectLanguage(title: string, content: string): ArticleLanguage {
  const sample = `${title} ${content}`;
  const devanagari = (sample.match(/[\u0900-\u097F]/g) ?? []).length;
  const latin = (sample.match(/[A-Za-z]/g) ?? []).length;
  if (devanagari > 20 && latin > 20) return 'mixed';
  if (devanagari > latin) return 'hi';
  if (latin > 0) return 'en';
  return 'mixed';
}

export function isPubliclyVisible(article: {
  status: ArticleStatus;
  publishedAt: Date;
  scheduledAt: Date | null;
}, now = new Date()): boolean {
  if (article.status === 'published' && article.publishedAt <= now) {
    return true;
  }
  if (
    article.status === 'scheduled' &&
    article.scheduledAt != null &&
    article.scheduledAt <= now
  ) {
    return true;
  }
  return false;
}
