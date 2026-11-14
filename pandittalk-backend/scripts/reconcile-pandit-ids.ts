/**
 * Prod pandit ID audit + reconciliation.
 *
 * Usage (from apps/backend):
 *   npx ts-node scripts/reconcile-pandit-ids.ts --audit
 *   npx ts-node scripts/reconcile-pandit-ids.ts --apply
 *
 * --audit   Read-only report (pandit rows, duplicates, dependents, mismatches).
 * --apply   Migrate stale pandit rows to PANDIT_STABLE_IDS (non-destructive to bookings/reviews).
 */
import { config } from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';
import { isUUID } from 'class-validator';
import {
  PANDIT_META_BY_PHONE,
  PANDIT_STABLE_IDS,
} from '../apps/user-service/prisma/pandit-seed';

config();

/** Pre-migration stable IDs (invalid or unused in prod) — used to detect orphan rows. */
const LEGACY_STABLE_IDS = new Set([
  'b2f4e8a1-3c6d-4f9e-a1b2-c8d3e4f5a6b7',
  'c3a5f9b2-4d7e-5a0f-b2c3-d9e0f1a2b3c4',
  'd4b6a0c3-5e8f-6b1a-c3d4-e0f1a2b3c4d5',
  'e5c7b1d4-6f9a-7c2b-d4e5-f1a2b3c4d5e6',
  'f6d8c2e5-7a0b-8d3c-e5f6-a2b3c4d5e6f7',
  'a7e9d3f6-8b1c-9e4d-f6a7-b3c4d5e6f7a8',
  'b8f0e4a7-9c2d-0f5e-a7b8-c4d5e6f7a8b9',
  'c9a1f5b8-0d3e-1a6f-b8c9-d5e6f7a8b9c0',
]);

const prisma = new PrismaClient();

type PanditRow = {
  id: string;
  name: string;
  userId: string | null;
  isOnline: boolean;
  phone: string | null;
};

async function loadPanditRows(): Promise<PanditRow[]> {
  const rows = await prisma.pandit.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      userId: true,
      isOnline: true,
      user: { select: { phoneNumber: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    userId: r.userId,
    isOnline: r.isOnline,
    phone: r.user?.phoneNumber ?? null,
  }));
}

async function dependentCounts(panditId: string): Promise<Record<string, number>> {
  const [bookings, reviews, availability] = await Promise.all([
    prisma.booking.count({ where: { panditId } }),
    prisma.review.count({ where: { panditId } }),
    prisma.panditAvailability.count({ where: { panditId } }),
  ]);
  return { bookings, reviews, availability };
}

function validateStableIds(): void {
  for (const [phone, id] of Object.entries(PANDIT_STABLE_IDS)) {
    if (!isUUID(id)) {
      throw new Error(`PANDIT_STABLE_IDS[${phone}] is not a valid UUID v3/v4/v5: ${id}`);
    }
  }
}

async function audit(): Promise<number> {
  validateStableIds();

  const db = await prisma.$queryRaw<{ db: string; host: string | null }[]>`
    SELECT current_database()::text AS db, inet_server_addr()::text AS host
  `;
  console.log('Database:', db[0]?.db, '| host:', db[0]?.host ?? 'local');

  const rows = await loadPanditRows();
  console.log(`\nPandit rows: ${rows.length}`);
  let issues = 0;

  for (const r of rows) {
    const validUuid = isUUID(r.id);
    const legacy = LEGACY_STABLE_IDS.has(r.id);
    const flags = [
      !validUuid ? 'NON_UUID' : null,
      legacy ? 'LEGACY_STABLE_ID' : null,
    ].filter(Boolean);
    console.log(
      `  ${flags.length ? `[${flags.join(',')}] ` : ''}${r.id} | ${r.name} | user=${r.userId ?? 'null'} | phone=${r.phone ?? 'null'} | online=${r.isOnline}`,
    );
    if (!validUuid || legacy) issues += 1;
  }

  const dupes = await prisma.$queryRaw<{ name: string; cnt: bigint }[]>`
    SELECT name, COUNT(*)::bigint AS cnt FROM pandits GROUP BY name HAVING COUNT(*) > 1
  `;
  console.log(`\nDuplicate names: ${dupes.length}`);
  for (const d of dupes) {
    console.log(`  ${d.name}: ${d.cnt}`);
    issues += Number(d.cnt) - 1;
  }

  console.log('\nPhone → stable ID alignment:');
  for (const [phone, stableId] of Object.entries(PANDIT_STABLE_IDS)) {
    const meta = PANDIT_META_BY_PHONE[phone];
    const byPhone = rows.find((r) => r.phone === phone);
    const byStable = rows.find((r) => r.id === stableId);
    const byName = rows.find((r) => r.name === meta?.displayName);
    const canonical = byPhone ?? byStable ?? byName;
    const status =
      canonical?.id === stableId
        ? 'OK'
        : canonical
          ? `MISMATCH (row ${canonical.id})`
          : 'MISSING';
    if (status !== 'OK') issues += 1;
    console.log(`  ${phone} → ${stableId} [${status}]`);
    if (canonical && canonical.id !== stableId) {
      const deps = await dependentCounts(canonical.id);
      console.log(`    dependents on stale row: ${JSON.stringify(deps)}`);
    }
  }

  const orphanLegacy = rows.filter((r) => LEGACY_STABLE_IDS.has(r.id));
  if (orphanLegacy.length > 0) {
    console.log(`\nOrphan legacy stable-id rows: ${orphanLegacy.length}`);
    issues += orphanLegacy.length;
  }

  console.log(`\nAudit issues: ${issues}`);
  return issues;
}

async function migratePanditRow(
  staleId: string,
  stableId: string,
  userId: string | null,
): Promise<void> {
  if (staleId === stableId) return;

  const stale = await prisma.pandit.findUnique({ where: { id: staleId } });
  if (!stale) return;

  await prisma.$transaction(async (tx) => {
    const target = await tx.pandit.findUnique({ where: { id: stableId } });

    if (!target) {
      await tx.pandit.create({
        data: {
          id: stableId,
          userId: null,
          name: stale.name,
          headline: stale.headline,
          bio: stale.bio,
          specialty: stale.specialty,
          languages: stale.languages,
          experience: stale.experience,
          pricePerSession: stale.pricePerSession,
          rating: stale.rating,
          totalReviews: stale.totalReviews,
          imageUrl: stale.imageUrl,
          isVerified: stale.isVerified,
          isOnline: stale.isOnline,
          isPremium: stale.isPremium,
          category: stale.category,
          guidanceAreas: stale.guidanceAreas,
        },
      });
    }

    if (userId) {
      await tx.pandit.updateMany({
        where: { userId, id: { not: stableId } },
        data: { userId: null },
      });
      await tx.pandit.update({
        where: { id: stableId },
        data: { userId },
      });
    }

    await tx.booking.updateMany({
      where: { panditId: staleId },
      data: { panditId: stableId },
    });
    await tx.review.updateMany({
      where: { panditId: staleId },
      data: { panditId: stableId },
    });
    await tx.panditAvailability.updateMany({
      where: { panditId: staleId },
      data: { panditId: stableId },
    });

    await tx.pandit.delete({ where: { id: staleId } });
  });

  console.log(`  Migrated ${staleId} → ${stableId}`);
}

async function apply(): Promise<void> {
  validateStableIds();
  const issues = await audit();
  if (issues === 0) {
    console.log('\nNo reconciliation needed.');
    return;
  }

  console.log('\nApplying reconciliation...');
  const rows = await loadPanditRows();

  for (const [phone, stableId] of Object.entries(PANDIT_STABLE_IDS)) {
    const meta = PANDIT_META_BY_PHONE[phone];
    if (!meta) continue;

    const user = await prisma.user.findUnique({ where: { phoneNumber: phone } });
    const byPhone = rows.find((r) => r.phone === phone);
    const byStable = rows.find((r) => r.id === stableId);
    const byName = rows.find((r) => r.name === meta.displayName);
    const stale = byPhone ?? byName;

    if (byStable && stale && byStable.id !== stale.id) {
      await migratePanditRow(stale.id, stableId, user?.id ?? stale.userId);
      continue;
    }

    if (stale && stale.id !== stableId) {
      await migratePanditRow(stale.id, stableId, user?.id ?? stale.userId);
      continue;
    }

    if (!byStable && user) {
      console.log(`  No pandit row at stable id for ${phone}; run prisma db seed -- --pandits-only after reconcile`);
    }
  }

  for (const legacyId of LEGACY_STABLE_IDS) {
    if (Object.values(PANDIT_STABLE_IDS).includes(legacyId)) continue;
    const orphan = await prisma.pandit.findUnique({ where: { id: legacyId } });
    if (!orphan) continue;
    const deps = await dependentCounts(legacyId);
    const total = deps.bookings + deps.reviews + deps.availability;
    if (total > 0) {
      throw new Error(
        `Legacy orphan ${legacyId} still has dependents: ${JSON.stringify(deps)}. Map phone and migrate first.`,
      );
    }
    await prisma.pandit.delete({ where: { id: legacyId } });
    console.log(`  Deleted orphan legacy row ${legacyId}`);
  }

  console.log('\nPost-apply audit:');
  await audit();
}

async function main(): Promise<void> {
  const applyMode = process.argv.includes('--apply');
  const auditMode = process.argv.includes('--audit') || !applyMode;

  if (auditMode && !applyMode) {
    await audit();
    return;
  }

  if (applyMode) {
    await apply();
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
