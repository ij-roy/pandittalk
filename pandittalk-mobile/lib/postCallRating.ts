export function canSendRating(rating: number, submitting: boolean): boolean {
  return !submitting && rating >= 1 && rating <= 5;
}
