/**
 * Upsert the App Store review demo user with enough wallet balance for Chat Now smoke.
 *
 * Usage (from apps/backend):
 *   npx ts-node scripts/ensure-app-review-demo-user.ts
 *   npx ts-node scripts/ensure-app-review-demo-user.ts +919999999998 500
 *
 * Requires DATABASE_URL. Keep phone on TEST_OTP_PHONE_ALLOWLIST in the target env.
 */
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config();

const prisma = new PrismaClient();

const DEFAULT_PHONE = '+919999999998';
const DEFAULT_BALANCE = 500;
/** Fixed adult DOB for marketplace age gate (#314). */
const DEMO_DOB = '1990-01-15';

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('+')) return trimmed;
  return `+91${trimmed.replace(/\D/g, '')}`;
}

async function main(): Promise<void> {
  const phone = normalizePhone(process.argv[2] ?? DEFAULT_PHONE);
  const balanceArg = process.argv[3];
  const balance = balanceArg ? Number(balanceArg) : DEFAULT_BALANCE;
  if (!Number.isFinite(balance) || balance < 101) {
    console.error('Balance must be a number >= 101 (Chat Now costs 101).');
    process.exit(1);
  }

  const now = new Date();
  const user = await prisma.user.upsert({
    where: { phoneNumber: phone },
    create: {
      phoneNumber: phone,
      walletBalance: balance,
      acceptedAge18: true,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      termsVersion: '2.0',
      privacyVersion: '2.0',
      dob: DEMO_DOB,
      firstName: 'App',
      lastName: 'Reviewer',
      name: 'App Reviewer',
      gender: 'prefer_not_to_say',
      placeOfBirth: 'Mumbai',
      profileCompleted: true,
      isActive: true,
    },
    update: {
      walletBalance: balance,
      acceptedAge18: true,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      dob: DEMO_DOB,
      firstName: 'App',
      lastName: 'Reviewer',
      name: 'App Reviewer',
      profileCompleted: true,
      isActive: true,
    },
    select: {
      id: true,
      phoneNumber: true,
      walletBalance: true,
      dob: true,
      acceptedAge18: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        id: user.id,
        phoneNumber: user.phoneNumber,
        walletBalance: Number(user.walletBalance),
        dob: user.dob,
        acceptedAge18: user.acceptedAge18,
        note: 'Ensure TEST_OTP_PHONE_ALLOWLIST includes this phone; OTP is 1234.',
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
