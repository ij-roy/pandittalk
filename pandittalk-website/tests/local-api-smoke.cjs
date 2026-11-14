/*
 * Local-only read-path smoke for the backend through the Caddy front door.
 *
 * Prerequisite:
 *   docker compose exec -T api node scripts/ensure-local-demo-data.cjs
 *
 * Run from pandittalk-website:
 *   npm run test:local-api
 */
const base = process.env.LOCAL_API_BASE || 'http://localhost:3001';
const demoPanditId = 'd1d7ccf5-08dc-45ea-9b16-0e7d04d8a001';
const demoBookingId = 'd1d7ccf5-08dc-45ea-9b16-0e7d04d8a002';

async function verify(phone, intent) {
  const response = await fetch(`${base}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: phone,
      otp: '1234',
      acceptedLegalConsent: true,
      ...(intent ? { intent } : {}),
    }),
  });
  if (!response.ok) throw new Error(`OTP verification failed: ${response.status}`);
  return (await response.json()).accessToken;
}

async function request(name, path, token) {
  const response = await fetch(`${base}${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error(`${name} returned HTTP ${response.status}`);
  return name;
}

async function expectStatus(name, path, expected, init = {}) {
  const response = await fetch(`${base}${path}`, init);
  if (response.status !== expected) {
    throw new Error(`${name} returned HTTP ${response.status}, expected ${expected}`);
  }
  return name;
}

async function verifyLocalAvatar(customerToken) {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  const form = new FormData();
  form.append('file', new Blob([png], { type: 'image/png' }), 'local-demo.png');
  const upload = await fetch(`${base}/users/profile/avatar`, {
    method: 'POST',
    headers: { authorization: `Bearer ${customerToken}` },
    body: form,
  });
  if (!upload.ok) throw new Error(`avatar-upload returned HTTP ${upload.status}`);
  const payload = await upload.json();
  if (typeof payload.profileImageUrl !== 'string') {
    throw new Error('avatar-upload did not return profileImageUrl');
  }
  const imageUrl = new URL(payload.profileImageUrl, base);
  const image = await fetch(`${base}${imageUrl.pathname}`);
  if (!image.ok || !(image.headers.get('content-type') || '').includes('image/')) {
    throw new Error(`avatar-static-read returned HTTP ${image.status}`);
  }
  return 'avatar-upload-and-static-read';
}

async function main() {
  const customerToken = await verify('+919999999998');
  const panditToken = await verify('+919999999997', 'dashboard');
  const checks = [
    ['liveness', '/', undefined],
    ['readiness', '/readiness', undefined],
    ['pandit-service', '/_internal/pandit', undefined],
    ['feature-flags', '/config/features', undefined],
    ['app-update-policy', '/public/app-update', undefined],
    ['expert-directory', '/experts', undefined],
    ['articles', '/articles', undefined],
    ['article-sitemap', '/articles/sitemap', undefined],
    ['expert-profile', `/experts/${demoPanditId}`, undefined],
    ['article-author', `/articles/authors/${demoPanditId}`, undefined],
    ['customer-profile', '/users/profile', customerToken],
    ['customer-bookings', '/bookings', customerToken],
    ['booking-detail', `/bookings/${demoBookingId}`, customerToken],
    ['notifications', '/notifications', customerToken],
    ['notification-count', '/notifications/unread-count', customerToken],
    ['reports', '/reports', customerToken],
    ['wallet', '/wallet', customerToken],
    ['unlocked-tools', '/tools/unlocked', customerToken],
    ['saved-contexts', '/users/contexts', customerToken],
    ['notification-preferences', '/users/notification-preferences', customerToken],
    ['blocked-pandits', '/users/blocks', customerToken],
    ['family-members', '/users/family-members', customerToken],
    ['pandit-profile', '/experts/me', panditToken],
    ['pandit-bookings', '/bookings/pandit', panditToken],
    ['pandit-articles', '/pandit/articles', panditToken],
    ['pandit-article-stats', '/pandit/articles/stats', panditToken],
    ['pandit-notifications', '/notifications', panditToken],
  ];
  for (const [name, path, token] of checks) await request(name, path, token);
  await expectStatus('unauthenticated-profile', '/users/profile', 401);
  await verifyLocalAvatar(customerToken);
  console.log(JSON.stringify({ ok: true, checks: checks.length + 2, base }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
