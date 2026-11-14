import {
  publicReviewWhere,
  publicReviewerFirstName,
  PLACEHOLDER_REVIEWER_NAMES,
  SEED_REVIEWER_PHONE,
} from './public-reviews';

describe('publicReviewerFirstName', () => {
  it.each([...PLACEHOLDER_REVIEWER_NAMES])(
    'hides placeholder name %s',
    (name) => {
      expect(publicReviewerFirstName(name)).toBeNull();
      expect(publicReviewerFirstName(name.toUpperCase())).toBeNull();
    },
  );

  it('keeps real names', () => {
    expect(publicReviewerFirstName('Priya')).toBe('Priya');
  });

  it('treats empty as null', () => {
    expect(publicReviewerFirstName(null)).toBeNull();
    expect(publicReviewerFirstName('  ')).toBeNull();
  });
});

describe('publicReviewWhere', () => {
  it('excludes placeholder names and seed reviewer phone', () => {
    const where = publicReviewWhere({ panditId: 'p1' });
    expect(where).toEqual({
      AND: [
        { panditId: 'p1' },
        {
          NOT: {
            OR: [
              ...PLACEHOLDER_REVIEWER_NAMES.map((name) => ({
                user: { firstName: { equals: name, mode: 'insensitive' } },
              })),
              { user: { phoneNumber: SEED_REVIEWER_PHONE } },
            ],
          },
        },
      ],
    });
  });
});
