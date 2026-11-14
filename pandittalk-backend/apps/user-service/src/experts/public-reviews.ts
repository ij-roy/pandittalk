import type { Prisma } from '@prisma/client';

/** Internal labels that must never inflate public rating / review counts. */
export const PLACEHOLDER_REVIEWER_NAMES = [
  'seed',
  'test',
  'demo',
  'admin',
  'user',
  'customer',
] as const;

/**
 * Dev seed reviewer phone from prisma/pandit-seed.ts.
 * Seeded with firstName null so name masking alone is not enough.
 */
export const SEED_REVIEWER_PHONE = '+919999999001';

const placeholderNameClauses: Prisma.ReviewWhereInput[] =
  PLACEHOLDER_REVIEWER_NAMES.map((name) => ({
    user: { firstName: { equals: name, mode: 'insensitive' } },
  }));

/** Prisma filter: reviews that are safe to show / aggregate on public expert APIs. */
export function publicReviewWhere(
  base: Prisma.ReviewWhereInput = {},
): Prisma.ReviewWhereInput {
  return {
    AND: [
      base,
      {
        NOT: {
          OR: [
            ...placeholderNameClauses,
            { user: { phoneNumber: SEED_REVIEWER_PHONE } },
          ],
        },
      },
    ],
  };
}

/** Never expose internal seed/test account labels on public profiles. */
export function publicReviewerFirstName(
  firstName: string | null | undefined,
): string | null {
  const trimmed = firstName?.trim() || '';
  if (!trimmed) return null;
  if (
    (PLACEHOLDER_REVIEWER_NAMES as readonly string[]).includes(
      trimmed.toLowerCase(),
    )
  ) {
    return null;
  }
  return trimmed;
}
