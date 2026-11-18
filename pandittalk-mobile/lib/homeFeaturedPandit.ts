import type { ExpertEntity } from './expertsApi';

export function selectFeaturedPandit(experts: ExpertEntity[]): ExpertEntity | null {
  return [...experts]
    .sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      if (b.ratingDisplay !== a.ratingDisplay) return b.ratingDisplay - a.ratingDisplay;
      if (b.totalReviews !== a.totalReviews) return b.totalReviews - a.totalReviews;
      return a.name.localeCompare(b.name, 'en');
    })[0] ?? null;
}
