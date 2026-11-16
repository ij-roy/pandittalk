import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedEndpoint } from '../../src/lib/api/security';
import {
  bookingCatalogPath,
  bookingQuotePath,
  expertSlotsPath,
  panditStatusPath,
} from '../../src/features/bookings/bookingApi';

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
