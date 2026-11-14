/**
 * Upsert EXTRA_PANDIT_SEEDS only. Does not modify the original 8 xlsx pandits.
 *
 * Usage (from apps/backend):
 *   npx ts-node scripts/upsert-extra-pandits.ts
 */
import { config } from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  AVAILABILITY_WINDOW_END,
  AVAILABILITY_WINDOW_START,
  DAYS_OF_WEEK,
  EXTRA_PANDIT_SEEDS,
  panditStableId,
  type PanditSeedRow,
} from '../apps/user-service/prisma/pandit-seed';

config();

const prisma = new PrismaClient();

async function upsertAvailability(panditId: string): Promise<void> {
  for (const dayOfWeek of DAYS_OF_WEEK) {
    const existing = await prisma.panditAvailability.findFirst({
      where: { panditId, dayOfWeek },
    });
    const row = {
      windowStart: AVAILABILITY_WINDOW_START,
      windowEnd: AVAILABILITY_WINDOW_END,
      isActive: true,
    };
    if (existing) {
      await prisma.panditAvailability.update({
        where: { id: existing.id },
        data: row,
      });
    } else {
      await prisma.panditAvailability.create({
        data: { panditId, dayOfWeek, ...row },
      });
    }
  }
}

async function upsertExtraPandit(seed: PanditSeedRow): Promise<void> {
  const stableId = panditStableId(seed.phone);
  if (!stableId) {
    throw new Error(`No stable pandit ID for phone ${seed.phone}`);
  }

  const user = await prisma.user.upsert({
    where: { phoneNumber: seed.phone },
    create: { phoneNumber: seed.phone, walletBalance: 0 },
    update: {},
  });

  const panditFields = {
    name: seed.displayName,
    headline: seed.headline,
    bio: seed.bio,
    specialty: seed.specialty,
    languages: seed.languages,
    experience: seed.experience,
    pricePerSession: new Prisma.Decimal(seed.pricePerSession),
    rating: new Prisma.Decimal(0),
    totalReviews: 0,
    imageUrl: null,
    isVerified: false,
    isPremium: seed.isPremium,
    isOnline: false,
    category: seed.category,
    guidanceAreas: [...seed.guidanceAreas],
  };

  await prisma.pandit.upsert({
    where: { id: stableId },
    create: {
      id: stableId,
      ...panditFields,
      user: { connect: { id: user.id } },
    },
    update: {
      ...panditFields,
      user: { connect: { id: user.id } },
    },
  });

  await upsertAvailability(stableId);
  console.log(`Upserted ${seed.displayName}`);
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL is not set');
  }

  for (const seed of EXTRA_PANDIT_SEEDS) {
    await upsertExtraPandit(seed);
  }

  console.log(`Done: ${EXTRA_PANDIT_SEEDS.length} extra pandits upserted.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
