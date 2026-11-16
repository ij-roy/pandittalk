import { expect, test } from '@playwright/test';
import { authenticateCustomer } from './fixtures';

const booking = {
  id: 'booking-fixture', panditId: 'pandit-fixture', panditName: 'Pandita Meera',
  format: 'chat', status: 'confirmed', area: 'career', startTime: '2026-10-02T10:00:00Z',
  durationMinutes: 25, totalPrice: 251, coinsDeducted: 251, notes: null, review: null,
};

test.beforeEach(async ({ page, context }) => {
  await authenticateCustomer(context);
  // Keep all account reads and writes inside local browser fixtures.
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const body = path === '/api/backend/bookings' ? [booking]
      : path === '/api/backend/bookings/booking-fixture' ? booking
      : path === '/api/backend/wallet' ? { coinBalance: 250, transactions: [] }
      : path === '/api/backend/users/profile' ? { firstName: 'Anika', lastName: 'Sharma', phoneNumber: '+919876543210' }
      : path === '/api/backend/users/contexts' ? [{ id: 'story-fixture', text: 'A career question.', version: 1, updatedAt: '2026-09-12T10:00:00Z' }]
      : path === '/api/backend/notifications/unread-count' ? { count: 0 }
      : path === '/api/backend/reports' || path === '/api/backend/notifications' ? [] : {};
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
});

test('sign out sends the JSON request required by the auth route', async ({ page }) => {
  let logoutRequest: { contentType?: string; body?: unknown } | undefined;
  await page.route('**/api/auth/logout', async route => {
    logoutRequest = {
      contentType: route.request().headers()['content-type'],
      body: route.request().postDataJSON(),
    };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });

  await page.goto('/account');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect.poll(() => logoutRequest).toEqual({ contentType: 'application/json', body: {} });
  await expect(page).toHaveURL(/\/login$/);
});

test('booking filters explain an empty view and let customers recover their history', async ({ page }) => {
  await page.goto('/bookings');
  await expect(page.getByRole('heading', { name: 'Pandita Meera' })).toBeVisible();
  await page.getByLabel('Show bookings').selectOption('completed');
  await expect(page.getByRole('heading', { name: 'No bookings in this view' })).toBeVisible();
  await expect(page.locator('#bookings-count')).toContainText('0 bookings');
  await page.getByRole('button', { name: 'Show all bookings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pandita Meera' })).toBeVisible();
});

test('booking cancellation requires the explicit final action and reports the result', async ({ page }) => {
  let cancellations = 0;
  await page.route('**/api/backend/bookings/booking-fixture/status', async route => {
    cancellations += 1;
    expect(route.request().postDataJSON()).toEqual({ status: 'cancelled' });
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/bookings/booking-fixture');
  await page.getByRole('button', { name: 'Cancel booking', exact: true }).click();
  await expect(page.getByText('Cancel this consultation?', { exact: true })).toBeVisible();
  expect(cancellations).toBe(0);
  await page.getByRole('button', { name: 'Keep booking', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirm cancellation', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancel booking', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm cancellation', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Cancellation confirmed' })).toContainText('Cancellation confirmed');
  expect(cancellations).toBe(1);
});

test('profile save retains entered details and announces success after reloading', async ({ page }) => {
  let saved: Record<string, unknown> = {};
  await page.route('**/api/backend/users/profile', async route => {
    if (route.request().method() === 'PATCH') saved = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ firstName: 'Anika', ...saved }) });
  });
  await page.goto('/account/profile');
  await page.getByLabel('First name', { exact: true }).fill('Anika Rao');
  await page.getByLabel('Birth place', { exact: true }).fill('Pune');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.locator('#profile-status')).toContainText('Profile saved.');
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Anika Rao');
  expect(saved).toEqual({ firstName: 'Anika Rao', placeOfBirth: 'Pune' });
});

test('story sharing uses the selected real booking and its Pandit', async ({ page }) => {
  let shared: unknown;
  await page.route('**/api/backend/users/contexts/story-fixture/share', async route => {
    shared = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/account/story');
  const shareDetails = page.locator('details').filter({ hasText: 'Share with your Pandit' });
  if (!(await shareDetails.getAttribute('open'))) {
    await shareDetails.locator('summary').click();
  }
  await expect(shareDetails.locator('select')).toBeVisible();
  await expect(shareDetails.getByRole('button', { name: 'Share this version', exact: true })).toBeDisabled();
  await shareDetails.locator('select').selectOption({ label: 'Pandita Meera · 2 Oct 2026 IST · chat' });
  await page.getByRole('button', { name: 'Share this version', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm share', exact: true }).click();
  await expect(page.locator('#story-message')).toContainText('This version was shared');
  expect(shared).toEqual({ bookingId: 'booking-fixture', panditId: 'pandit-fixture' });
});

test('wallet errors can recover to a clear empty transaction state', async ({ page }) => {
  let reads = 0;
  await page.route('**/api/backend/wallet', async route => {
    reads += 1;
    await route.fulfill({ status: reads === 1 ? 503 : 200, contentType: 'application/json', body: JSON.stringify(reads === 1 ? { message: 'Wallet temporarily unavailable.' } : { coinBalance: 250, transactions: [] }) });
  });
  await page.goto('/wallet');
  await expect(page.getByRole('alert').filter({ hasText: 'Wallet temporarily unavailable.' })).toContainText('Wallet temporarily unavailable.');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No transactions yet' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Available wallet balance' })).toContainText('250');
});

test('wallet recharge opens a server-priced checkout and verifies before showing success', async ({ page }) => {
  let verifyPayload: Record<string, unknown> | undefined;
  await page.addInitScript(() => {
    class FakeRazorpay {
      private readonly options: { handler: (value: Record<string, string>) => void; modal?: { ondismiss?: () => void } };
      constructor(options: { handler: (value: Record<string, string>) => void; modal?: { ondismiss?: () => void } }) {
        this.options = options;
      }
      open() {
        this.options.handler({
          razorpay_order_id: 'order_test_123',
          razorpay_payment_id: 'pay_test_123',
          razorpay_signature: 'signature_test_123',
        });
      }
      on() { /* The success path does not need a payment.failed event. */ }
    }
    (window as unknown as { Razorpay: typeof FakeRazorpay }).Razorpay = FakeRazorpay;
  });
  await page.route('**/api/backend/wallet', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      coinBalance: 250,
      transactions: [],
      packages: [{ id: 'pack-starter', label: 'Starter', coins: 500, bonusCoins: 50, priceInr: 499, isActive: true }],
    }) });
  });
  await page.route('**/api/backend/wallet/create-order', async route => {
    expect(route.request().postDataJSON()).toEqual({ coinPackageId: 'pack-starter' });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      orderId: 'order_test_123', amount: 49900, currency: 'INR', keyId: 'rzp_test_key',
      package: { label: 'Starter', coins: 500, bonusCoins: 50, priceInr: 499 },
    }) });
  });
  await page.route('**/api/backend/wallet/verify-payment', async route => {
    verifyPayload = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, coinsAdded: 550, newBalance: 800 }) });
  });
  await page.goto('/wallet/recharge');
  await expect(page.getByRole('heading', { name: 'Add coins to your wallet' })).toBeVisible();
  await expect(page.getByText('500 coins + 50 bonus')).toBeVisible();
  await page.getByRole('button', { name: 'Pay ₹499 securely', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Coins added to your wallet' })).toBeVisible();
  expect(verifyPayload).toEqual({
    razorpayOrderId: 'order_test_123',
    razorpayPaymentId: 'pay_test_123',
    razorpaySignature: 'signature_test_123',
  });
});

test('wallet recharge does not show success when server verification fails', async ({ page }) => {
  await page.addInitScript(() => {
    class FakeRazorpay {
      private readonly options: { handler: (value: Record<string, string>) => void };
      constructor(options: { handler: (value: Record<string, string>) => void }) { this.options = options; }
      open() { this.options.handler({ razorpay_order_id: 'order_test_failed', razorpay_payment_id: 'pay_test_failed', razorpay_signature: 'bad_signature' }); }
      on() { /* No provider failure event in this verification test. */ }
    }
    (window as unknown as { Razorpay: typeof FakeRazorpay }).Razorpay = FakeRazorpay;
  });
  await page.route('**/api/backend/wallet', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      coinBalance: 250,
      transactions: [],
      packages: [{ id: 'pack-starter', label: 'Starter', coins: 500, bonusCoins: 0, priceInr: 499, isActive: true }],
    }) });
  });
  await page.route('**/api/backend/wallet/create-order', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orderId: 'order_test_failed', amount: 49900, currency: 'INR', keyId: 'rzp_test_key' }) });
  });
  await page.route('**/api/backend/wallet/verify-payment', async route => {
    await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Payment verification failed' }) });
  });
  await page.goto('/wallet/recharge');
  await page.getByRole('button', { name: 'Pay ₹499 securely', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Payment verification failed' })).toContainText('Payment verification failed');
  await expect(page.getByText('Coins added to your wallet.', { exact: true })).toHaveCount(0);
});

test('wallet recharge follows the backend payment availability flag', async ({ page }) => {
  await page.route('**/api/backend/wallet', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      coinBalance: 250,
      paymentsEnabled: false,
      transactions: [],
      packages: [{ id: 'pack-starter', label: 'Starter', coins: 500, bonusCoins: 50, priceInr: 499, isActive: true }],
    }) });
  });
  await page.goto('/wallet/recharge');

  await expect(page.getByRole('heading', { name: 'Add coins to your wallet' })).toBeVisible();
  await expect(page.getByText('Wallet top-ups are temporarily unavailable.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Pay .* securely/ })).toHaveCount(0);
  await expect(page.getByText('500 coins + 50 bonus', { exact: true })).toHaveCount(0);
});

test('wallet recharge keeps the payment choice readable on mobile and desktop', async ({ page }) => {
  await page.route('**/api/backend/wallet', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      coinBalance: 250,
      transactions: [],
      packages: [
        { id: 'pack-starter', label: 'Starter', coins: 500, bonusCoins: 50, priceInr: 499, isActive: true },
        { id: 'pack-deep', label: 'Deep', coins: 1200, bonusCoins: 250, priceInr: 999, isActive: true },
      ],
    }) });
  });
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/wallet/recharge');
    await expect(page.getByRole('heading', { name: 'Add coins to your wallet' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pay ₹499 securely', exact: true })).toBeVisible();
    await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), { message: `No horizontal overflow at ${width}px` }).toBe(true);
  }
});

test('customer navigation stays usable without overflow at 320 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of ['/account', '/account/profile', '/account/story', '/bookings', '/wallet', '/reports', '/notifications']) {
    await page.goto(path);
    await expect(page.getByRole('navigation', { name: 'Your account', exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Your account', exact: true }).locator('[aria-current="page"]')).toHaveCount(1);
    await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), { message: `No horizontal overflow on ${path}` }).toBe(true);
  }
});

test('a mismatched session link offers the booked format without accessing devices', async ({ page }) => {
  await page.goto('/sessions/booking-fixture/video');
  await expect(page.getByRole('heading', { name: 'Your chat room is ready' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open chat room', exact: true })).toHaveAttribute('href', '/sessions/booking-fixture/chat');
  await expect(page.getByRole('button', { name: 'Join consultation', exact: true })).toHaveCount(0);
});
