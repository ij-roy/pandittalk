import { expect, test } from '@playwright/test';

test('site icon loads without a conflicting route', async ({ request }) => {
  const response = await request.get('/favicon.ico');
  expect(response.status()).toBeLessThan(400);
});

test('mobile navigation closes with Escape and returns focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.locator('.mobile-menu summary');
  await toggle.click();
  const menu = page.locator('#mobile-navigation');
  await expect(menu).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await expect(menu).not.toBeVisible();
  await expect(toggle).toBeFocused();
});

test('navigation identifies the current section and mobile links close the menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.mobile-menu summary').click();
  const menu = page.locator('#mobile-navigation');
  await expect(menu).toBeVisible();
  await menu.getByRole('link', { name: 'Find guidance', exact: true }).click();
  await expect(page).toHaveURL(/\/guidance$/);
  await expect(menu).not.toBeVisible();
  await page.locator('.mobile-menu summary').click();
  await expect(menu.getByRole('link', { name: 'Find guidance', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('mobile navigation is a contained sheet with one clear signed-out action set', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.mobile-menu summary').click();

  const menu = page.locator('#mobile-navigation');
  await expect(menu).toBeVisible();
  await expect(page.locator('.mobile-menu-backdrop')).toBeVisible();

  const layout = await menu.evaluate(element => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return { position: style.position, maxHeight: style.maxHeight, top: rect.top, bottom: rect.bottom };
  });
  expect(layout.position).toBe('fixed');
  expect(layout.bottom).toBeLessThanOrEqual(844);
  expect(layout.maxHeight).not.toBe('none');

  await expect(menu.getByRole('link', { name: 'Tools', exact: true })).toHaveCount(1);
  await expect(menu.getByRole('link', { name: 'Free tools', exact: true })).toHaveCount(0);
  await expect(menu.getByRole('link', { name: 'How it works', exact: true })).toHaveCount(0);
  await expect(menu.getByRole('link', { name: 'How booking works', exact: true })).toHaveCount(1);
  await expect(menu.getByRole('link', { name: 'Sign in', exact: true })).toHaveCount(1);

  const linkHeights = await menu.locator('a.mobile-nav-link').evaluateAll(elements => elements.map(element => parseFloat(getComputedStyle(element).minHeight)));
  expect(linkHeights.length).toBeGreaterThan(0);
  expect(linkHeights.every(height => height >= 48)).toBe(true);
});
