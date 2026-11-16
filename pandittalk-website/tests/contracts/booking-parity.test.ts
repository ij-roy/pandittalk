import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { allowedEndpoint } from '../../src/lib/api/security';
import {
  bookingCatalogPath,
  bookingQuotePath,
  expertSlotsPath,
  panditStatusPath,
} from '../../src/features/bookings/bookingApi';
import { parseQueueEvent, queueExpiredMessage } from '../../src/features/bookings/queue-events';

test('booking parity paths are allowed only for the required backend contracts', () => {
  assert.equal(allowedEndpoint('GET', '/booking-catalog'), true);
  assert.equal(allowedEndpoint('GET', '/booking-catalog/quote'), true);
  assert.equal(allowedEndpoint('GET', '/experts/p-1/all-slots'), true);
  assert.equal(allowedEndpoint('GET', '/bookings/pandit/p-1/status'), true);
  assert.equal(allowedEndpoint('POST', '/bookings'), true);
  assert.equal(allowedEndpoint('POST', '/bookings/chat-now'), true);
  assert.equal(allowedEndpoint('POST', '/sessions/audio/join'), true);
  assert.equal(allowedEndpoint('PATCH', '/bookings/b-1/reschedule'), true);
  assert.equal(allowedEndpoint('POST', '/admin/bookings'), false);
});

test('booking adapter builds encoded read-only paths without price or booking simulation', () => {
  assert.equal(bookingCatalogPath(), '/booking-catalog');
  assert.equal(bookingQuotePath('standard', 'video'), '/booking-catalog/quote?depth=standard&format=video');
  assert.equal(expertSlotsPath('pandit/one', '2026-11-16', 25), '/experts/pandit%2Fone/all-slots?date=2026-11-16&duration=25');
  assert.equal(panditStatusPath('pandit/one'), '/bookings/pandit/pandit%2Fone/status');
});

test('queue events are accepted only for the selected Pandit and expose recovery copy', () => {
  assert.deepEqual(
    parseQueueEvent('pandit-a', 'queueReady', {
      panditId: 'pandit-a',
      expiresAt: '2026-11-16T10:01:00.000Z',
      message: 'Your turn is ready.',
    }),
    {
      type: 'ready',
      panditId: 'pandit-a',
      expiresAt: '2026-11-16T10:01:00.000Z',
      message: 'Your turn is ready.',
    },
  );
  assert.equal(parseQueueEvent('pandit-a', 'queueReady', { panditId: 'pandit-b', expiresAt: 'bad' }), null);
  assert.deepEqual(
    parseQueueEvent('pandit-a', 'queuePositionUpdated', {
      panditId: 'pandit-a',
      position: 2,
      queueLength: 3,
      estimatedWaitMinutes: 30,
    }),
    { type: 'position', panditId: 'pandit-a', position: 2, queueLength: 3, estimatedWaitMinutes: 30 },
  );
  assert.equal(parseQueueEvent('pandit-a', 'queuePositionUpdated', { panditId: 'pandit-a', position: 2, queueLength: 3 }), null);
  assert.deepEqual(
    parseQueueEvent('pandit-a', 'queueExpired', { panditId: 'pandit-a', reason: 'turn_timeout' }),
    { type: 'expired', panditId: 'pandit-a', reason: 'turn_timeout' },
  );
  assert.equal(queueExpiredMessage('max_wait'), 'Your Chat Now queue wait expired. Nothing was charged.');
  assert.equal(queueExpiredMessage('pandit_offline'), 'The Pandit went offline before your turn. Nothing was charged.');
});

test('public format copy keeps scheduled Audio/Video separate from Chat Now', () => {
  const source = readFileSync(resolve(import.meta.dirname, '../../src/app/(public)/how-it-works/page.tsx'), 'utf8');
  assert.match(source, /Scheduled bookings use audio or video/);
  assert.match(source, /Chat Now is a separate live chat path/);
  assert.doesNotMatch(source, /Scheduled bookings can use chat, audio or video/);
});

test('guidance copy does not claim timed prices are unavailable', () => {
  const source = readFileSync(resolve(import.meta.dirname, '../../src/features/guidance/GuidanceFlow.tsx'), 'utf8');
  assert.match(source, /When you choose a real booking, the booking service supplies the current duration and total/);
  assert.doesNotMatch(source, /Prices are not available yet/);
});

test('availability copy uses timed-booking language instead of the retired No Timer name', () => {
  const source = readFileSync(resolve(import.meta.dirname, '../../src/content/availability.ts'), 'utf8');
  assert.match(source, /timedBookingExplanation/);
  assert.doesNotMatch(source, /noTimerExplanation/);
});

test('shared navigation describes live booking information instead of a booking waitlist', () => {
  const availability = readFileSync(resolve(import.meta.dirname, '../../src/content/availability.ts'), 'utf8');
  const footer = readFileSync(resolve(import.meta.dirname, '../../src/components/site/SiteFooter.tsx'), 'utf8');
  const header = readFileSync(resolve(import.meta.dirname, '../../src/components/site/SiteHeader.tsx'), 'utf8');
  assert.match(availability, /Timed sessions and Chat Now are available/);
  assert.match(availability, /headerLink: 'How booking works'/);
  assert.doesNotMatch(footer, /Get booking updates/);
  assert.doesNotMatch(header, />Booking updates</);
});
