import { expect, test } from '@playwright/test';

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
  await menu.getByRole('link', { name: 'Find guidance', exact: true }).click();
  await expect(page).toHaveURL(/\/guidance$/);
  await expect(menu).not.toBeVisible();
  await page.locator('.mobile-menu summary').click();
  await expect(menu.getByRole('link', { name: 'Find guidance', exact: true })).toHaveAttribute('aria-current', 'page');
});
