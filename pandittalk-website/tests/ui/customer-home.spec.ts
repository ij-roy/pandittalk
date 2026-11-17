import { expect, test } from '@playwright/test';
import { authenticateCustomer } from './fixtures';

const booking = {
  id: 'home-booking-fixture', panditId: 'pandit-fixture', panditName: 'Pandita Meera',
  format: 'chat', status: 'confirmed', area: 'career', startTime: '2026-10-02T10:00:00Z',
  durationMinutes: 25, totalPrice: 251, coinsDeducted: 251, notes: null, review: null,
};

test.beforeEach(async ({ page, context }) => {
  await authenticateCustomer(context);
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const body = path === '/api/backend/bookings' ? [booking]
      : path === '/api/backend/wallet' ? { coinBalance: 250 }
      : path === '/api/backend/notifications/unread-count' ? { count: 0 }
      : path === '/api/backend/reports' ? [] : {};
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
});

test('customer home makes finding a Pandit the primary empty-state action', async ({ page }) => {
  await page.route('**/api/backend/bookings', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto('/home');

  await expect(page.locator('[data-home-primary]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Find your next conversation', exact: true })).toBeVisible();
  await expect(page.locator('[data-home-primary] .button', { hasText: 'Explore Pandits' })).toBeVisible();
  await expect(page.locator('[data-home-primary] .actions a')).toHaveCount(2);
  await expect(page.locator('[data-home-summary]')).toHaveCount(3);
  await expect(page.locator('[data-summary-arrow]')).toHaveCount(3);
  await expect(page.getByText('Open wallet →', { exact: true })).toBeVisible();
  await expect(page.getByText('Open updates →', { exact: true })).toBeVisible();
  await expect(page.getByText('Open reports →', { exact: true })).toBeVisible();
  const refresh = page.getByRole('button', { name: 'Refresh overview', exact: true });
  await expect(refresh).toBeVisible();
  await expect(refresh.getByText('Refresh', { exact: true })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Booking formats' })).toHaveCount(0);
  await expect(page.locator('[data-home-secondary-link]')).toHaveCount(3);
  const secondaryHeights = await page.locator('[data-home-secondary-link]').evaluateAll(items => items.map(item => item.getBoundingClientRect().height));
  expect(Math.max(...secondaryHeights)).toBeLessThan(120);
  await expect(page.locator('[data-home-shortcuts]')).toHaveCount(0);
  await expect(page.locator('main').getByRole('link', { name: 'Prepare a draft', exact: true })).toHaveCount(0);
  await expect(page.getByText('Press Escape to leave this notice.', { exact: true })).toHaveCount(0);
  await expect(page.locator('main').getByText(/Arrow keys|Escape returns|Skip remains/)).toHaveCount(0);
});

test('customer home prioritizes the next booking when one exists', async ({ page }) => {
  await page.route('**/api/backend/bookings', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify([{ ...booking, startTime: '2026-12-02T10:00:00Z' }]),
  }));
  await page.goto('/home');

  await expect(page.locator('[data-home-primary]')).toContainText('Your next conversation');
  await expect(page.locator('[data-home-primary]')).toContainText('Pandita Meera');
  await expect(page.getByRole('link', { name: /Open booking/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open existing chat session/ })).toBeVisible();
});

test('customer home keeps a recoverable overview error without implementation copy', async ({ page }) => {
  await page.route('**/api/backend/bookings', route => route.fulfill({
    status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Bookings temporarily unavailable.' }),
  }));
  await page.goto('/home');

  await expect(page.locator('[data-home-primary]').getByRole('alert')).toContainText('Bookings temporarily unavailable.');
  await expect(page.getByRole('button', { name: 'Retry overview', exact: true })).toBeVisible();
  await expect(page.getByText('Press Escape to leave this alert.', { exact: true })).toHaveCount(0);
});

test('customer home stays within the viewport at key responsive widths', async ({ page }) => {
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/home');
    await expect(page.locator('[data-home-primary]')).toBeVisible();
    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth);
  }
});
