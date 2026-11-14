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

test('booking filters explain an empty view and let customers recover their history', async ({ page }) => {
  await page.goto('/bookings');
  await expect(page.getByRole('heading', { name: 'Pandita Meera' })).toBeVisible();
  await page.getByLabel('Show bookings').selectOption('completed');
  await expect(page.getByRole('heading', { name: 'No bookings in this view' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('0 bookings');
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
  await expect(page.getByRole('status')).toContainText('Cancellation request submitted');
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
  await expect(page.getByRole('status')).toContainText('Profile saved.');
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
  await page.getByText('Share with your Pandit', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Share this version', exact: true })).toBeDisabled();
  await page.getByLabel('Booking', { exact: true }).selectOption('booking-fixture');
  await page.getByRole('button', { name: 'Share this version', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('This version was shared');
  expect(shared).toEqual({ bookingId: 'booking-fixture', panditId: 'pandit-fixture' });
});

test('wallet errors can recover to a clear empty transaction state', async ({ page }) => {
  let reads = 0;
  await page.route('**/api/backend/wallet', async route => {
    reads += 1;
    await route.fulfill({ status: reads === 1 ? 503 : 200, contentType: 'application/json', body: JSON.stringify(reads === 1 ? { message: 'Wallet temporarily unavailable.' } : { coinBalance: 250, transactions: [] }) });
  });
  await page.goto('/wallet');
  await expect(page.getByRole('alert')).toContainText('Wallet temporarily unavailable.');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No transactions yet' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Available wallet balance' })).toContainText('250');
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
