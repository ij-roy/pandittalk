export const STORE_RATING_MIN_STARS = 4;

export function shouldAskStoreRating(rating: number, alreadyAsked: boolean): boolean {
  return !alreadyAsked && rating >= STORE_RATING_MIN_STARS && rating <= 5;
}

export function storeRatingPrompt(os: string): { title: string; body: string; action: string } {
  if (os === 'ios') {
    return {
      title: 'Enjoying PanditTalk?',
      body: 'A short App Store rating helps other people find a pandit.',
      action: 'Rate on the App Store',
    };
  }
  return {
    title: 'Enjoying PanditTalk?',
    body: 'A short Play Store rating helps other people find a pandit.',
    action: 'Rate on the Play Store',
  };
}
