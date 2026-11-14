import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnTo, allowedEndpoint, trustedMutation, normalizePhone } from '../../src/lib/api/security';

test('return paths cannot escape the website or contain private query data', () => {
  for (const path of ['https://evil.test','//evil.test','/\\evil.test','/home?notes=private','/%2f%2fevil.test']) assert.equal(safeReturnTo(path), '/home');
  assert.equal(safeReturnTo('/bookings/abc'), '/bookings/abc');
});
test('proxy never exposes privileged routes or encoded path escapes', () => {
  for (const path of ['/wallet/webhook','/sessions/audio/create','/experts/me','/pandit/articles','/users/profile/../admin','/experts/%2e%2e']) assert.equal(allowedEndpoint('POST',path), false);
  assert.equal(allowedEndpoint('GET','/wallet'), true);
  assert.equal(allowedEndpoint('POST','/wallet/verify-payment'), true);
  assert.equal(allowedEndpoint('GET','/experts/abc'), true);
});
test('mutations require an exact origin and JSON or multipart content', () => {
  assert.equal(trustedMutation('https://web.test', 'https://evil.test', 'application/json'),false);
  assert.equal(trustedMutation('https://web.test', null, 'application/json'),false);
  assert.equal(trustedMutation('https://web.test', 'https://web.test', 'text/plain'),false);
  assert.equal(trustedMutation('https://web.test', 'https://web.test', 'application/json'),true);
});
test('phone normalization follows Indian mobile DTO, not arbitrary international numbers', () => {
  assert.equal(normalizePhone('98765 43210'), '+919876543210');
  assert.equal(normalizePhone('+919876543210'), '+919876543210');
  assert.equal(normalizePhone('+12025550123'), null);
});
