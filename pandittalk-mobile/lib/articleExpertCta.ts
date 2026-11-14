export type ArticleExpertTarget = {
  label: string;
  area?: 'career_business' | 'love_relationships';
  search?: string;
};

const TARGETS: Record<string, ArticleExpertTarget> = {
  career: { label: 'Talk to a career expert', area: 'career_business' },
  relationships: { label: 'Talk to a relationships expert', area: 'love_relationships' },
  astrology: { label: 'Talk to an astrology expert', search: 'Astrology' },
  spirituality: { label: 'Talk to a spirituality expert', search: 'spiritual' },
  vastu: { label: 'Talk to a Vastu expert', search: 'Vastu' },
  numerology: { label: 'Talk to a numerology expert', search: 'Numerology' },
  tarot: { label: 'Talk to a tarot expert', search: 'Tarot' },
  palmistry: { label: 'Talk to a palmistry expert', search: 'Palmistry' },
};

export function articleExpertTarget(category: string): ArticleExpertTarget {
  return TARGETS[category.trim()] ?? { label: 'Talk to an expert' };
}
