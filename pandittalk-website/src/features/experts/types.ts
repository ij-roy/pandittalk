export type ExpertReview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_first_name: string | null;
};

export type Expert = {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  total_reviews: number;
  category: string;
  bio: string;
  languages: string[];
  image_url: string | null;
  isOnline: boolean;
  reviews?: ExpertReview[];
};

export const categories = [
  ['marriage_family', 'Marriage & family'],
  ['career_business', 'Career & business'],
  ['love_relationships', 'Love & relationships'],
  ['finance_wealth', 'Finance & wealth · spiritual guidance'],
  ['health_wellbeing', 'Health & wellbeing · spiritual guidance'],
  ['spiritual_protection', 'Spiritual protection'],
] as const;

const salutations = new Set(['pandit', 'pandita', 'shri', 'shree', 'smt']);
const placeholderReviewerNames = new Set([
  'seed', 'test', 'demo', 'admin', 'user', 'customer', 'seeker', 'guest', 'anonymous', 'n/a', 'na', 'sample',
]);
/** Known seed-review blurbs — never show as public social proof. */
const placeholderReviewComments = new Set([
  'very clear and practical guidance. felt reassured after the session.',
  'accurate insights and thoughtful remedies. highly recommend.',
  'clear and practical guidance. felt reassured after the session.',
  'thoughtful remedies and a calm pace. would consult again.',
  'patient listener with deep knowledge. will consult again.',
  'helpful session, would book again.',
  'clear guidance and calm presence.',
  'good advice for my situation.',
  'great session.',
  'excellent guidance.',
  'highly recommended.',
  'very helpful.',
]);
const genericSeedBioSnippets = [
  'experienced vedic astrologer offering practical guidance on career, relationships, family, and life decisions',
  'sessions are conducted in hindi and english',
  'dedicated counsel for relationships, marriage',
  'practical guidance for students and early-career',
  'experienced guidance for career, business & life decisions',
];

export function expertFirstName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  while (words.length && salutations.has(words[0].replace(/\.+$/, '').toLowerCase())) words.shift();
  return words[0] || name;
}

/** True when bio still looks like a shared seed template rather than a personal intro. */
export function isGenericSeedBio(bio: string | null | undefined) {
  const text = bio?.trim().toLowerCase() || '';
  if (!text) return true;
  return genericSeedBioSnippets.some(snippet => text.includes(snippet));
}

/** Hide internal seed/test labels so public trust signals stay credible. */
export function reviewAuthorLabel(name: string | null | undefined) {
  const trimmed = name?.trim() || '';
  if (!trimmed || placeholderReviewerNames.has(trimmed.toLowerCase())) return 'A customer';
  return trimmed;
}

export function isPublicReview(review: { user_first_name?: string | null; rating?: number; comment?: string | null }) {
  const name = review.user_first_name?.trim().toLowerCase() || '';
  if (placeholderReviewerNames.has(name)) return false;
  if (!Number.isFinite(review.rating) || (review.rating as number) < 1 || (review.rating as number) > 5) return false;
  const comment = review.comment?.trim().toLowerCase() || '';
  if (comment && placeholderReviewComments.has(comment)) return false;
  // Rating-only rows with no customer name are common seed noise — keep them off public profiles.
  if (!name && !comment) return false;
  return true;
}

/** Presence copy for profile discovery; Chat Now still checks the live booking service. */
export function presenceLabel(isOnline: boolean, compact = false) {
  if (compact) return isOnline ? 'Check Chat Now' : 'Check scheduled times';
  return isOnline ? 'Chat Now may be available' : 'View scheduled times';
}

export function filterExperts(rows: Expert[], language: string, sort: string) {
  return rows
    .filter(expert => !language || expert.languages.includes(language))
    .slice()
    .sort((a, b) => {
      const aStats = trustworthyReviewStats(a);
      const bStats = trustworthyReviewStats(b);
      const byName = a.name.localeCompare(b.name);
      return sort === 'experience' ? b.experience - a.experience || byName
        : sort === 'rating' ? bStats.rating - aStats.rating || bStats.total - aStats.total || byName
          : sort === 'reviews' ? bStats.total - aStats.total || bStats.rating - aStats.rating || byName
            : byName;
    });
}

/**
 * Prefer filtered public reviews whenever a reviews payload is present.
 * Cached API totals are easy to inflate with seed data — never show those alone
 * as social proof. Without a reviews array, hide ratings rather than trust aggregates.
 */
export function trustworthyReviewStats(expert: Pick<Expert, 'rating' | 'total_reviews' | 'reviews'>) {
  const hasReviewPayload = Array.isArray(expert.reviews);
  const publicListed = (expert.reviews || []).filter(isPublicReview);
  const listed = publicListed.length;
  if (hasReviewPayload) {
    if (listed === 0) return { rating: 0, total: 0 };
    const rating = Number((publicListed.reduce((sum, review) => sum + review.rating, 0) / listed).toFixed(1));
    return { rating, total: listed };
  }
  // No review list: refuse unverified aggregates so seed totals cannot become public proof.
  return { rating: 0, total: 0 };
}
