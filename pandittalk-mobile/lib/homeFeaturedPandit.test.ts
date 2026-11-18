import assert from 'node:assert/strict';
import test from 'node:test';

import type { ExpertEntity } from './expertsApi';
import { selectFeaturedPandit } from './homeFeaturedPandit.ts';

function expert(overrides: Partial<ExpertEntity>): ExpertEntity {
  return {
    id: 'expert-id',
    name: 'Real Pandit',
    specialty: 'Career guidance',
    languagesDisplay: 'Hindi, English',
    languages: ['Hindi', 'English'],
    experienceYears: 8,
    experienceLabel: '8 Years Experience',
    rating: 4,
    ratingDisplay: 4.2,
    totalReviews: 12,
    reviewCountLabel: '12 Reviews',
    bio: 'Guidance tailored to you.',
    imageUrl: null,
    verified: false,
    isOnline: false,
    isPremium: false,
    category: 'Career & Business',
    pricePerSession: 251,
    ...overrides,
  };
}

test('selectFeaturedPandit prefers an online verified expert', () => {
  const selected = selectFeaturedPandit([
    expert({ id: 'bookable', name: 'Bookable Pandit' }),
    expert({ id: 'online', name: 'Online Pandit', isOnline: true }),
    expert({ id: 'verified-online', name: 'Verified Pandit', isOnline: true, verified: true }),
  ]);

  assert.equal(selected?.id, 'verified-online');
});

test('selectFeaturedPandit falls back to the first real expert when nobody is online', () => {
  const selected = selectFeaturedPandit([
    expert({ id: 'first', name: 'First Pandit' }),
    expert({ id: 'second', name: 'Second Pandit', ratingDisplay: 5 }),
  ]);

  assert.equal(selected?.id, 'second');
});

test('selectFeaturedPandit returns null for an empty API result', () => {
  assert.equal(selectFeaturedPandit([]), null);
});
