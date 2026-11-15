import { expect, test } from '@playwright/test';

const expert = {
  id: 'expert-a', name: 'Pandita Meera Sharma', specialty: 'Jyotish', experience: 12,
  rating: 4.8, total_reviews: 24, category: 'career_business',
  bio: 'Guidance for a thoughtful next step.', languages: ['Hindi', 'English'], image_url: null, isOnline: true,
};

test.beforeEach(async ({ page }) => {
  // Every browser API call stays in the test; no OTP, application or tool request reaches a service.
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const body = url.pathname === '/api/backend/experts' ? [expert]
      : url.pathname === '/api/backend/wallet' ? { coinBalance: 25 } : {};
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
});

test('guidance keeps the chosen Pandit and restores draft notes', async ({ page }) => {
  await page.goto('/guidance/start?expertId=expert-a');
  await page.getByLabel('Where would you like guidance?').selectOption('career');
  await page.getByRole('button', { name: '2. Your question', exact: true }).click();
  await page.getByLabel('Your question or context (optional)').fill('Considering a change at work.');
  await page.getByRole('button', { name: '3. What to expect', exact: true }).click();
  await page.getByRole('button', { name: '4. Format', exact: true }).click();
  await page.getByLabel('Chat', { exact: true }).check();
  await page.getByRole('button', { name: '5. Your Pandit', exact: true }).click();
  await expect(page.getByLabel('Optional Pandit preference (not a booking)')).toHaveValue('expert-a');
  await page.reload();
  await page.getByRole('button', { name: '6. Review draft', exact: true }).click();
  await expect(page.locator('dd', { hasText: 'Pandita Meera Sharma' })).toBeVisible();
  await expect(page.locator('dd', { hasText: 'Considering a change at work.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Review draft', exact: true })).toBeFocused();
});

test('guidance start fresh works when draft storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const unavailable = {
      getItem: () => null,
      setItem: () => { throw new Error('Storage unavailable'); },
      removeItem: () => { throw new Error('Storage unavailable'); },
    };
    Object.defineProperty(window, 'sessionStorage', { value: unavailable });
    Object.defineProperty(window, 'localStorage', { value: unavailable });
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/guidance/start');
  await page.getByLabel('Where would you like guidance?').selectOption('career');
  await page.getByRole('button', { name: '2. Your question', exact: true }).click();
  await page.getByLabel('Your question or context (optional)').fill('Temporary draft');
  await page.getByRole('button', { name: 'Clear draft and start over', exact: true }).click();
  await page.getByRole('button', { name: 'Clear draft', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your area', exact: true })).toBeVisible();
  await page.getByLabel('Where would you like guidance?').selectOption('career');
  await page.getByRole('button', { name: '2. Your question', exact: true }).click();
  await expect(page.getByLabel('Your question or context (optional)')).toHaveValue('');
  await expect(page.getByText('This browser cannot preserve your draft.', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('successful Pandit application resets fields and keeps the confirmation', async ({ page }) => {
  let received: Record<string, unknown> | undefined;
  await page.route('**/api/backend/pandit-applications', async route => {
    received = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'TEST-APPLICATION-42', status: 'received' }) });
  });
  await page.goto('/for-pandits');
  await page.getByLabel('Name', { exact: true }).fill('Meera Sharma');
  await page.getByLabel('Indian mobile number').fill('9876543210');
  await page.getByLabel('Practice', { exact: true }).fill('Jyotish');
  await page.getByLabel('Languages', { exact: true }).fill('Hindi, English');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Submit application', exact: true }).click();
  await expect(page.locator('#application-status')).toContainText('Application received. Reference: TEST-APPLICATION-42');
  await expect(page.getByRole('button', { name: 'Submit another application', exact: true })).toBeVisible();
  await expect(page.locator('#apply form input[name="name"]')).toHaveCount(0);
  await expect(page.locator('form').getByRole('alert')).toHaveCount(0);
  expect(received?.languages).toEqual(['Hindi', 'English']);
});

test('directory empty results can clear the active search', async ({ page }) => {
  await page.route('**/api/backend/experts?*', async route => {
    const query = new URL(route.request().url()).searchParams.get('search');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(query ? [] : [expert]) });
  });
  await page.goto('/pandits');
  await expect(page.getByRole('link', { name: expert.name, exact: true })).toBeVisible();
  await page.getByLabel('Name or practice').fill('No matching person');
  await expect(page.getByRole('heading', { name: 'No matching Pandits right now.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear all filters', exact: true }).click();
  await expect(page.getByLabel('Name or practice')).toHaveValue('');
  await expect(page.getByRole('link', { name: expert.name, exact: true })).toBeVisible();
});

test('invalid palm replacement clears the previous photo and prevents submission', async ({ page }) => {
  let toolRequests = 0;
  await page.route('**/api/backend/tools/palm-reading', async route => {
    toolRequests += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/tools/palm-reading');
  const photo = { name: 'palm.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64') };
  await page.getByLabel('Left palm photo').setInputFiles(photo);
  await page.getByLabel('Right palm photo').setInputFiles(photo);
  await expect(page.getByAltText('left palm preview')).toBeVisible();
  await page.getByLabel('Left palm photo').setInputFiles({ name: 'palm.heic', mimeType: 'image/heic', buffer: Buffer.from('not a supported palm photo') });
  await expect(page.locator('#tool-form-error')).toContainText('HEIC photos cannot be used for your left palm.');
  await expect(page.getByAltText('left palm preview')).toHaveCount(0);
  await expect(page.getByLabel('Left palm photo')).toHaveValue('');
  await page.getByRole('checkbox').check();
  await expect(page.getByRole('button', { name: 'Get free reading', exact: true })).toBeDisabled();
  expect(toolRequests).toBe(0);
});

test('a resend cooldown still permits verifying the existing OTP', async ({ page }) => {
  let requests = 0;
  let verifications = 0;
  await page.route('**/api/auth/request-otp', async route => {
    requests += 1;
    await route.fulfill({ status: requests === 1 ? 200 : 429, contentType: 'application/json', headers: { 'retry-after': '30' }, body: JSON.stringify(requests === 1 ? { success: true } : { message: 'Please wait before requesting another code.' }) });
  });
  await page.route('**/api/auth/verify-otp', async route => {
    verifications += 1;
    await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Test verification received.' }) });
  });
  await page.goto('/login');
  await page.getByLabel('Indian mobile number').fill('9876543210');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Send code', exact: true }).click();
  await page.getByRole('button', { name: 'Resend code', exact: true }).click();
  await expect(page.getByLabel('Phone sign-in actions').getByRole('button', { name: /Resend in \d+s/ })).toBeDisabled();
  await page.getByLabel('Four-digit code').fill('1234');
  await page.getByRole('button', { name: 'Verify and continue', exact: true }).click();
  await expect(page.locator('form').getByRole('alert')).toContainText('Test verification received.');
  expect(verifications).toBe(1);
});
