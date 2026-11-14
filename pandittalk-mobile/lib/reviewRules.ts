export const REVIEW_RULES =
  'Choose one whole star from 1 to 5. A comment is optional, and stars alone are enough.';

const STAR_WORDS = ['', 'Poor', 'Fair', 'Okay', 'Good', 'Excellent'] as const;

export function reviewStarWord(rating: number): string | null {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return STAR_WORDS[rating];
}

export function reviewCanSubmit(rating: number): boolean {
  return reviewStarWord(rating) != null;
}
