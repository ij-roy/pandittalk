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
      : path === '/api/backend/reports' ? []
      : path === '/api/backend/users/profile' ? { phoneNumber: '+919876543210', firstName: 'IJ' }
      : path === '/api/backend/experts' ? []
      : path === '/api/auth/session' ? { signedIn: true }
      : {};
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
});

test('customer home leads with consultations and matches the mobile information order', async ({ page }) => {
  await page.route('**/api/backend/bookings', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto('/home');

  await expect(page.locator('.homeConsultHero')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Talk to a verified pandit', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Chat Now/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Book chat, audio or video/ })).toBeVisible();
  await expect(page.locator('.homeTopicTile')).toHaveCount(6);
  await expect(page.getByRole('heading', { name: 'Helpful reading', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Self-service tools', exact: true })).toBeVisible();
  await expect(page.getByText('Optional self-service tools', { exact: true })).toHaveCount(0);
  await expect(page.locator('.homeAccountCard')).toHaveCount(3);
});

test('customer home keeps the next booking available without displacing consultation actions', async ({ page }) => {
  await page.route('**/api/backend/bookings', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify([{ ...booking, startTime: '2026-12-02T10:00:00Z' }]),
  }));
  await page.goto('/home');

  await expect(page.locator('.homeUpcoming')).toContainText('Pandita Meera');
  await expect(page.getByRole('link', { name: /Open booking/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Talk to a verified pandit', exact: true })).toBeVisible();
});

test('customer home keeps a recoverable account overview error without hiding the home', async ({ page }) => {
  await page.route('**/api/backend/bookings', route => route.fulfill({
    status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Bookings temporarily unavailable.' }),
  }));
  await page.goto('/home');

  await expect(page.locator('.homeConsultHero')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry overview', exact: true })).toBeVisible();
  await expect(page.getByText('Some account details are unavailable.')).toBeVisible();
});

test('customer home stays within the viewport at key responsive widths', async ({ page }) => {
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/home');
    await expect(page.locator('.homeConsultHero')).toBeVisible();
    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth);
  }
});

test('signed-in website uses the shared five-item app navigation at desktop and mobile widths', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/home');

    if (width <= 768) {
      const nav = page.getByRole('navigation', { name: 'Primary navigation' });
      await expect(nav).toBeVisible();
      await expect(nav.locator('a')).toHaveText(['Consult', 'Experts', 'Guidance', 'Tools', 'Profile']);
      const layout = await nav.evaluate(element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return { position: style.position, bottom: rect.bottom, innerHeight: window.innerHeight };
      });
      expect(layout.position).toBe('fixed');
      expect(layout.bottom).toBeLessThanOrEqual(layout.innerHeight);
    } else {
      await expect(page.locator('nav.desktop-nav')).toContainText('Consult');
      await expect(page.locator('nav.desktop-nav')).toContainText('Experts');
      await expect(page.locator('nav.desktop-nav')).toContainText('Articles');
      await expect(page.getByRole('link', { name: 'My home', exact: true })).toHaveCount(0);
      await expect(page.locator('.navWrap')).toHaveCount(0);
    }
  }
});
