/*
 * Create deterministic, local-only records for end-to-end verification.
 *
 * Run from the repository root after Compose is healthy:
 *   docker compose exec api node scripts/ensure-local-demo-data.cjs
 *
 * The accounts are intended for ALLOW_TEST_OTP / TEST_OTP_PHONE_ALLOWLIST.
 * This script never runs as part of production startup and does not create
 * fake reviews, payments, or completed sessions.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CUSTOMER_PHONE = '+919999999998';
const PANDIT_PHONE = '+919999999997';
const PANDIT_ID = 'd1d7ccf5-08dc-45ea-9b16-0e7d04d8a001';
const BOOKING_ID = 'd1d7ccf5-08dc-45ea-9b16-0e7d04d8a002';
const AUDIO_BOOKING_ID = 'd1d7ccf5-08dc-45ea-9b16-0e7d04d8a003';
const VIDEO_BOOKING_ID = 'd1d7ccf5-08dc-45ea-9b16-0e7d04d8a004';

function upsertDemoBooking({ id, customerId, panditId, format, durationMinutes, totalPrice, notes, startTime, endTime, bufferEndTime }) {
  return prisma.booking.upsert({
    where: { id },
    create: {
      id,
      userId: customerId,
      panditId,
      area: 'career',
      depth: 'entry',
      format,
      durationMinutes,
      sessionModel: 'legacy_timed',
      startTime,
      endTime,
      bufferEndTime,
      totalPrice,
      coinsDeducted: totalPrice,
      status: 'confirmed',
      notes,
    },
    update: {
      userId: customerId,
      panditId,
      area: 'career',
      depth: 'entry',
      format,
      durationMinutes,
      sessionModel: 'legacy_timed',
      startTime,
      endTime,
      bufferEndTime,
      totalPrice,
      coinsDeducted: totalPrice,
      status: 'confirmed',
      notes,
    },
  });
}

async function main() {
  const now = new Date();
  const startTime = new Date(now.getTime() - 60_000);
  const endTime = new Date(startTime.getTime() + 15 * 60_000);
  const bufferEndTime = new Date(endTime.getTime() + 5 * 60_000);

  const customer = await prisma.user.upsert({
    where: { phoneNumber: CUSTOMER_PHONE },
    create: {
      phoneNumber: CUSTOMER_PHONE,
      firstName: 'Local',
      lastName: 'Customer',
      name: 'Local Demo Customer',
      walletBalance: 500,
      acceptedAge18: true,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      termsVersion: '2.0',
      privacyVersion: '2.0',
      dob: '1990-01-15',
      profileCompleted: true,
      isActive: true,
    },
    update: {
      firstName: 'Local',
      lastName: 'Customer',
      name: 'Local Demo Customer',
      walletBalance: 500,
      acceptedAge18: true,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      termsVersion: '2.0',
      privacyVersion: '2.0',
      dob: '1990-01-15',
      profileCompleted: true,
      isActive: true,
    },
  });

  const panditUser = await prisma.user.upsert({
    where: { phoneNumber: PANDIT_PHONE },
    create: {
      phoneNumber: PANDIT_PHONE,
      firstName: 'Local',
      lastName: 'Pandit',
      name: 'Local Demo Pandit',
      walletBalance: 0,
      acceptedAge18: true,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      termsVersion: '2.0',
      privacyVersion: '2.0',
      profileCompleted: true,
      isActive: true,
    },
    update: {
      firstName: 'Local',
      lastName: 'Pandit',
      name: 'Local Demo Pandit',
      isActive: true,
      profileCompleted: true,
    },
  });

  const pandit = await prisma.pandit.upsert({
    where: { id: PANDIT_ID },
    create: {
      id: PANDIT_ID,
      userId: panditUser.id,
      name: 'Local Demo Pandit',
      headline: 'Local runtime verification expert',
      bio: 'A local-only account used to verify PanditTalk journeys.',
      specialty: 'System design demo sessions',
      languages: ['Hindi', 'English'],
      experience: 5,
      pricePerSession: 251,
      rating: 0,
      totalReviews: 0,
      isVerified: true,
      isOnline: true,
      presenceSeenAt: now,
      isPremium: false,
      category: 'System Design Demo',
      guidanceAreas: ['career', 'family'],
    },
    update: {
      userId: panditUser.id,
      name: 'Local Demo Pandit',
      headline: 'Local runtime verification expert',
      bio: 'A local-only account used to verify PanditTalk journeys.',
      specialty: 'System design demo sessions',
      languages: ['Hindi', 'English'],
      experience: 5,
      pricePerSession: 251,
      isVerified: true,
      isOnline: true,
      presenceSeenAt: now,
      category: 'System Design Demo',
      guidanceAreas: ['career', 'family'],
    },
  });

  const booking = await upsertDemoBooking({
    id: BOOKING_ID,
    customerId: customer.id,
    panditId: pandit.id,
    format: 'chat',
    durationMinutes: 15,
    totalPrice: 101,
    notes: 'Local-only replica and dashboard verification booking.',
    startTime,
    endTime,
    bufferEndTime,
  });
  const audioBooking = await upsertDemoBooking({
    id: AUDIO_BOOKING_ID,
    customerId: customer.id,
    panditId: pandit.id,
    format: 'audio',
    durationMinutes: 30,
    totalPrice: 201,
    notes: 'Local-only browser audio-provider verification booking.',
    startTime,
    endTime: new Date(startTime.getTime() + 30 * 60_000),
    bufferEndTime: new Date(startTime.getTime() + 35 * 60_000),
  });
  const videoBooking = await upsertDemoBooking({
    id: VIDEO_BOOKING_ID,
    customerId: customer.id,
    panditId: pandit.id,
    format: 'video',
    durationMinutes: 30,
    totalPrice: 301,
    notes: 'Local-only browser video-provider verification booking.',
    startTime,
    endTime: new Date(startTime.getTime() + 30 * 60_000),
    bufferEndTime: new Date(startTime.getTime() + 35 * 60_000),
  });

  console.log(JSON.stringify({
    ok: true,
    customer: { phone: CUSTOMER_PHONE, id: customer.id, otp: '1234' },
    pandit: { phone: PANDIT_PHONE, id: pandit.id, userId: panditUser.id, otp: '1234' },
    booking: { id: booking.id, format: booking.format, status: booking.status },
    mediaBookings: [
      { id: audioBooking.id, format: audioBooking.format, status: audioBooking.status },
      { id: videoBooking.id, format: videoBooking.format, status: videoBooking.status },
    ],
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
