import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

const publicRoutes = [
  '/', '/pandits', '/guidance', '/guidance/start', '/tools', '/tools/kundli',
  '/tools/compatibility', '/tools/horoscope', '/tools/palm-reading', '/tools/tarot',
  '/tools/kundli/detailed', '/tools/compatibility/detailed', '/tools/monthly-horoscope',
  '/articles', '/about', '/contact', '/our-approach', '/how-it-works', '/pricing',
  '/download', '/trust', '/accessibility', '/editorial-policy', '/help', '/for-pandits',
  '/privacy', '/terms-and-conditions', '/refund-and-cancellation-policy', '/pricing-policy',
  '/cookie-policy', '/disclaimer', '/grievance-redressal', '/delete-account', '/login',
  ...['career', 'love', 'family', 'marriage', 'education', 'health', 'business', 'finance'].map(topic => '/guidance/' + topic),
  ...['first-consultation', 'coins-and-payment-pending', 'booking-cancellation', 'joining-audio-video', 'chat-reconnect', 'account-access', 'refunds-and-complaints'].map(slug => '/help/' + slug),
];

const requiredViewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

test.describe('Public route reflow', () => {
  for (const width of [390, 1440]) {
    for (const route of publicRoutes) {
      test(`${route} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        const response = await page.goto(route);
        expect(response?.status()).toBeLessThan(400);
        await expect(page.locator('h1').first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
        await expect(page.locator('.site-header')).toHaveCount(1);
        await expect(page.locator('.site-footer')).toHaveCount(1);
        expect(errors).toEqual([]);
      });
    }
  }
});

test.describe('Representative device sizes', () => {
  for (const { width, height } of requiredViewports) {
    test(`homepage and key layouts at ${width}x${height}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height });
      await mkdir('output/ui-screenshots', { recursive: true });
      for (const [route, name] of [['/', 'home'], ['/pandits', 'pandits'], ['/tools/compatibility', 'compatibility'], ['/login', 'login'], ['/privacy', 'privacy']]) {
        await page.goto(route);
        await expect(page.locator('h1').first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const overflowing = await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter(element => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.right > innerWidth + 2 && getComputedStyle(element).position !== 'fixed' && !element.closest('details:not([open]), .legal-tabs, .legal-table-wrap, .journal-table-wrap, nextjs-portal');
        }).map(element => element.tagName + '.' + element.className).slice(0, 8));
        expect(overflowing, `${route}: overflowing elements`).toEqual([]);
        await page.screenshot({ path: `output/ui-screenshots/${name}-${width}.png`, fullPage: name === 'home', animations: 'disabled' });
      }
    });
  }
});

test.describe('Accessible public screens', () => {
  for (const route of ['/', '/pandits', '/guidance', '/guidance/start', '/tools', '/tools/compatibility', '/tools/palm-reading', '/tools/tarot', '/login', '/privacy', '/terms-and-conditions', '/articles', '/about', '/contact', '/help', '/for-pandits']) {
    test(`WCAG scan ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(results.violations.map(issue => ({ id: issue.id, impact: issue.impact, nodes: issue.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }))).toEqual([]);
    });
  }
});

test('mobile primary action stays in the initial screen and skip link reaches content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const primary = page.locator('.hero .button').first();
  await expect(primary).toBeInViewport({ ratio: 1 });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#site-content')).toBeFocused();
});

for (const viewport of [
  { width: 390, height: 844, topicColumns: 2 },
  { width: 1440, height: 900, topicColumns: 4 },
]) {
  test(`homepage keeps a compact form and deliberate grid at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const inputHeight = await page.locator('.home-update input[type="email"]').evaluate(element => element.getBoundingClientRect().height);
    expect(inputHeight).toBeGreaterThanOrEqual(44);
    expect(inputHeight).toBeLessThanOrEqual(56);
    const rowHeight = await page.locator('.home-update .notify-open-row').evaluate(element => element.getBoundingClientRect().height);
    expect(rowHeight).toBeLessThanOrEqual(viewport.width < 900 ? 150 : 100);

    const columns = await page.locator('.topic-links').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length);
    expect(columns).toBe(viewport.topicColumns);

    const heroGuide = await page.locator('.hero-guide-card').boundingBox();
    const heroCopy = await page.locator('.hero-copy').boundingBox();
    expect(heroGuide).not.toBeNull();
    expect(heroCopy).not.toBeNull();
    if (viewport.width < 900) expect(heroGuide!.y).toBeGreaterThan(heroCopy!.y);
    else expect(heroGuide!.x).toBeGreaterThan(heroCopy!.x);
  });
}

test('large text and reduced motion keep the homepage usable', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, elements: Array.from(document.querySelectorAll('body *')).filter(element => !element.closest('details:not([open]), nextjs-portal') && element.getBoundingClientRect().right > innerWidth + 2).map(element => ({ tag: element.tagName, class: element.className, width: element.getBoundingClientRect().width, right: element.getBoundingClientRect().right })).slice(0, 12) }));
  expect(overflow.width, JSON.stringify(overflow.elements)).toBeLessThanOrEqual(769);
  await expect(page.locator('.hero .actions .button').first()).toBeVisible();
});
