import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ signedIn: false }) });
  });
  await page.route('**/api/backend/experts**', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
});

test('homepage leads with customer value and one concise availability action', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find a calmer next step for the question on your mind.');
  await expect(page.locator('.hero .button').first()).toHaveText(/Explore Pandits/);
  await expect(page.locator('.hero .button').nth(1)).toHaveText(/Try a free tool/);
  await expect(page.getByText('New conversations are opening soon.', { exact: true })).toBeVisible();
  await expect(page.locator('.hero .notify-open-form')).toHaveCount(1);
  await expect(page.locator('.home-page').getByText('No Timer isn\'t open yet.', { exact: true })).toHaveCount(0);
});

test('normal homepage content does not expose keyboard implementation instructions', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#home-faq-hint')).toHaveClass(/sr-only/);
  await expect(page.locator('.hero-availability').getByText('Press Escape to leave this region.', { exact: true })).toHaveCount(0);
});

test('header keeps a useful guest path while session checking is slow', async ({ page }) => {
  await page.route('**/api/auth/session', async route => {
    await new Promise(resolve => setTimeout(resolve, 1800));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ signedIn: false }) });
  });

  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible({ timeout: 1000 });
  await expect(page.getByText('Checking session…', { exact: true })).toHaveCount(0);
});

test('slow Pandit loading offers a next step instead of a silent skeleton', async ({ page }) => {
  await page.route('**/api/backend/experts**', async route => {
    await new Promise(resolve => setTimeout(resolve, 1800));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.goto('/pandits');
  await expect(page.getByText('Still loading? You can use free tools or prepare a draft while profiles load.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('While Pandit results load').getByRole('link', { name: 'Try free tools', exact: true })).toBeVisible();
});

test('guidance uses plain-language steps and stores the draft in the browser', async ({ page }) => {
  await page.goto('/guidance/start');

  await expect(page.getByRole('button', { name: '3. What to expect', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '3. No Timer status', exact: true })).toHaveCount(0);
  await page.getByLabel('Where would you like guidance?').selectOption('career');
  await page.getByRole('button', { name: '2. Your question', exact: true }).click();
  await page.getByLabel('Your question or context (optional)').fill('A question I want to think through.');

  await expect(page.getByText(/Draft notes stay in this browser\./)).toBeVisible();
  await expect.poll(async () => page.evaluate(() => Boolean(localStorage.getItem('pandittalk.guidance.draft')))).toBe(true);
});

test('tool pages explain privacy before collecting sensitive details', async ({ page }) => {
  await page.goto('/tools/palm-reading');

  await expect(page.getByRole('link', { name: 'Privacy policy', exact: true })).toBeVisible();
  await expect(page.getByText('This page does not save a copy on your device unless you choose to.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Left palm photo')).toHaveAttribute('capture', 'environment');
});

test('a completed reading can be saved locally and restored on return', async ({ page }) => {
  await page.route('**/api/backend/tools/horoscope', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sign: 'aries', todayInsight: 'Make room for a small useful step.', luckyColor: 'Ochre', luckyTime: 'Morning' }),
    });
  });

  await page.goto('/tools/horoscope');
  await page.getByRole('button', { name: 'Aries', exact: true }).click();
  await page.getByRole('button', { name: 'Get free reading', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your reading', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save this reading on this browser', exact: true }).click();
  await expect(page.getByText('Saved on this browser. Only this device can access this copy until you remove it.', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText('Saved reading restored from this browser.', { exact: true })).toBeVisible();
  await expect(page.getByText('Make room for a small useful step.', { exact: true })).toBeVisible();
});

test('sign-in leads with the private-space value before availability caveats', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Sign in to your private space.', exact: true })).toBeVisible();
  await expect(page.getByLabel('Indian mobile number (+91)')).toBeVisible();
  await expect(page.locator('.auth-availability')).toBeVisible();
  await expect(page.locator('.auth-availability').evaluate(node => node.compareDocumentPosition(document.querySelector('.auth-panel')!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
});

test('policy pages keep keyboard guidance out of the visible mobile reading flow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/privacy');

  await expect(page.locator('#legal-tabs-hint')).toHaveClass(/sr-only/);
  await expect(page.getByText(/Swipe sideways on small screens to see every policy\./)).toHaveCount(0);
});
