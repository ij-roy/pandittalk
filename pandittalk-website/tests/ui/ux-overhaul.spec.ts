import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ signedIn: false }) });
  });
  await page.route('**/api/backend/experts**', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
});

test('homepage hero leads with value, two choices and a useful guide', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find a calmer next step for the question on your mind.');
  await expect(page.locator('.hero-brand')).toHaveCount(0);
  await expect(page.locator('.hero .actions a')).toHaveCount(2);
  await expect(page.locator('.hero .actions a').first()).toHaveText(/Explore Pandits/);
  await expect(page.locator('.hero .actions a').nth(1)).toHaveText(/Prepare a private draft/);
  await expect(page.locator('.hero-guide-card')).toBeVisible();
  await expect(page.locator('.hero-trust-list li')).toHaveCount(4);
  await expect(page.locator('.hero .notify-open-form')).toHaveCount(0);
  await expect(page.locator('.home-page .eyebrow')).toHaveCount(0);
  await expect(page.locator('.site-footer .eyebrow')).toHaveCount(0);
});

test('homepage explains the first-time visitor path in concrete language', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Choose a topic, compare Pandit profiles, and prepare your question privately before you decide whether to talk.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start with what feels closest.', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'See who you may speak with.', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start with a reading or a tool.', exact: true })).toBeVisible();
});

test('homepage asks for an email once, after explaining the service', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.home-update .notify-open-form')).toHaveCount(1);
  await expect(page.locator('.home-page .notify-open-form')).toHaveCount(1);
  const updateTop = await page.locator('.home-update').evaluate(element => element.getBoundingClientRect().top);
  expect(updateTop).toBeGreaterThan(await page.evaluate(() => innerHeight));
  await expect(page.locator('.home-page')).not.toContainText(/no timer|countdown|minute-by-minute/i);
});

test('homepage does not look unfinished while the Pandit API is unavailable', async ({ page }) => {
  await page.route('**/api/backend/experts**', async route => {
    await new Promise(resolve => setTimeout(resolve, 2500));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.goto('/');
  await expect(page.getByText('Finding Pandits…', { exact: true })).toHaveCount(0);
  await expect(page.locator('.expert-row-skeleton')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Explore Pandit profiles/i })).toBeVisible();
});

test('homepage enhancement remains decorative and motion-aware', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.locator('.reveal-on-scroll').first()).toBeVisible();
  await expect(page.locator('.spotlight-card')).toHaveCount(3);
  await expect(page.locator('.hero-orbit-art')).toHaveAttribute('aria-hidden', 'true');
  const motion = await page.locator('.hero-orbit-art').evaluate(element => {
    const ring = element.querySelector('.hero-orbit-ring');
    return ring ? getComputedStyle(ring).animationName : null;
  });
  expect(motion).toBe('none');
});

test('homepage hero uses a calm decorative aurora with a reduced-motion fallback', async ({ page }) => {
  await page.goto('/');

  const aurora = page.locator('.hero-aurora');
  await expect(aurora).toHaveCount(1);
  await expect(aurora).toHaveAttribute('aria-hidden', 'true');
  await expect(aurora.locator('canvas.hero-aurora-canvas')).toHaveCount(1);
  await expect(aurora.locator('.hero-aurora-fallback')).toHaveCount(1);
  await expect(aurora).toHaveAttribute('data-aurora-engine', /^(webgl|fallback)$/);
  await expect.poll(async () => aurora.locator('canvas').evaluate(element => ({ width: element.width, height: element.height }))).toMatchObject({ width: expect.any(Number), height: expect.any(Number) });
  expect(await aurora.getAttribute('data-aurora-running')).toBe('true');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('.hero-aurora')).toHaveAttribute('data-aurora-running', 'false');
});

test('homepage avoids decorative eyebrow labels that compete with its message', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.home-page .eyebrow')).toHaveCount(0);
  await expect(page.locator('.site-footer .eyebrow')).toHaveCount(0);
});

test('footer gives first-time visitors one clear next step', async ({ page }) => {
  await page.goto('/');

  const footer = page.locator('.site-footer');
  await expect(footer.getByRole('heading', { name: 'Choose where to begin.', exact: true })).toBeVisible();
  await expect(footer.locator('.footer-top-actions .button')).toHaveCount(2);
  await expect(footer.locator('.footer-top-actions')).not.toContainText('Booking updates');
  await expect(footer.getByText('Explore profiles, choose a topic, or prepare a private draft before you decide what comes next.', { exact: true })).toBeVisible();
});

test('footer navigation collapses into readable groups on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const footer = page.locator('.site-footer');
  const firstGroup = footer.locator('.footer-nav-group').first();
  await expect(firstGroup.locator('summary')).toHaveText('Discover');
  await expect(firstGroup.locator('nav')).not.toBeVisible();

  await firstGroup.locator('summary').click();
  await expect(firstGroup.locator('nav')).toBeVisible();
  await expect(firstGroup.getByRole('link', { name: 'Explore Pandits', exact: true })).toBeVisible();
});

test('footer navigation remains expanded on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const footer = page.locator('.site-footer');
  await expect(footer.locator('.footer-nav-group').first().getByRole('link', { name: 'Explore Pandits', exact: true })).toBeVisible();
});

test('homepage reveal content cannot remain hidden indefinitely', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2200);

  const hidden = await page.locator('.reveal-on-scroll').evaluateAll(elements => elements.filter(element => element.getAttribute('data-reveal-visible') !== 'true').length);
  expect(hidden).toBe(0);
});

test('normal homepage content does not expose keyboard implementation instructions', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#home-faq-hint')).toHaveClass(/sr-only/);
  await expect(page.getByText('Press Escape to leave this region.', { exact: true })).toHaveCount(0);
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
