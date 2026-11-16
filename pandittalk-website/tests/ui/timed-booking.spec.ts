import { expect, test } from '@playwright/test';
import { authenticateCustomer } from './fixtures';

const expert = {
  id: 'expert-a', name: 'Pandita Meera Sharma', specialty: 'Jyotish', experience: 12,
  rating: 4.8, total_reviews: 24, category: 'career_business',
  bio: 'Guidance for a thoughtful next step.', languages: ['Hindi', 'English'], image_url: null, isOnline: true,
};

const catalog = {
  version: 1,
  sessionModel: 'legacy_timed',
  scheduled: {
    depths: [
      { key: 'entry', label: 'Entry', durationMinutes: 15, basePrice: 151 },
      { key: 'standard', label: 'Standard', durationMinutes: 25, basePrice: 301 },
      { key: 'deep', label: 'Deep', durationMinutes: 45, basePrice: 501 },
    ],
    formats: [
      { key: 'audio', label: 'Audio', surcharge: 0 },
      { key: 'video', label: 'Video', surcharge: 150 },
    ],
    bufferMinutes: 5,
    preStartJoinWindowMinutes: 15,
  },
  chatNow: { enabled: true, durationMinutes: 15, totalPrice: 101, noShowRefundMinutes: 10, maxQueueDepth: 5, maxQueueWaitMinutes: 15, queueTurnTimeoutSeconds: 60 },
  session: { gracePeriodSeconds: 90, warningSeconds: 300, panditReconnectSeconds: 60 },
  cancellation: { confirmedBeforeStart: 'full_wallet_refund', panditNoShow: 'full_wallet_refund', panditDisconnect: 'partial_unused_time_wallet_refund', refundDestination: 'wallet' },
  areas: [{ key: 'career', label: 'Career' }, { key: 'love', label: 'Love' }],
};

test('completes a scheduled audio booking with a backend quote and no client price', async ({ page, context }) => {
  await authenticateCustomer(context);
  let received: Record<string, unknown> | undefined;
  await page.route('**/api/backend/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    let body: unknown = {};
    if (path === '/api/backend/booking-catalog') body = catalog;
    else if (path === '/api/backend/booking-catalog/quote') body = { sessionModel: 'legacy_timed', depth: 'entry', format: 'audio', durationMinutes: 15, totalPrice: 151, coinsDeducted: 151 };
    else if (path === '/api/backend/experts/expert-a') body = expert;
    else if (path === '/api/backend/experts/expert-a/all-slots') body = [{ startTime: '2026-11-20T04:30:00.000Z', status: 'available' }];
    else if (path === '/api/backend/wallet') body = { coinBalance: 500, transactions: [] };
    else if (path === '/api/backend/bookings' && request.method() === 'POST') {
      received = request.postDataJSON();
      body = { id: 'booking-new', panditId: 'expert-a', startTime: '2026-11-20T04:30:00.000Z', durationMinutes: 15, totalPrice: 151, coinsDeducted: 151, status: 'confirmed' };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto('/bookings/new?expertId=expert-a');
  await expect(page.getByRole('heading', { name: 'Book a timed consultation', exact: true })).toBeVisible();
  await expect(page.getByLabel('Format').locator('option')).toHaveCount(2);
  await expect(page.getByLabel('Format').locator('option', { hasText: 'Chat' })).toHaveCount(0);
  await page.getByLabel('Topic').selectOption('career');
  await page.getByLabel('Session depth').selectOption('entry');
  await page.getByLabel('Format').selectOption('audio');
  await page.getByRole('textbox', { name: 'Date' }).fill('2026-11-20');
  await page.getByRole('button', { name: /10:00 am/i }).click();
  await page.getByRole('button', { name: 'Review booking', exact: true }).click();
  await expect(page.getByText(/15 minutes/)).toBeVisible();
  await expect(page.getByText('151 coins', { exact: true })).toBeVisible();
  const terms = page.getByRole('region', { name: 'Cancellation and refund terms' });
  await expect(terms).toContainText('Cancel before the session starts');
  await expect(terms).toContainText('90 seconds');
  await expect(terms).toContainText('wallet');
  await page.getByRole('button', { name: /Confirm booking/ }).click();
  await expect(page).toHaveURL(/\/bookings\/booking-new$/);
  expect(received).toMatchObject({ panditId: 'expert-a', area: 'career', depth: 'entry', format: 'audio', sessionModel: 'legacy_timed' });
  expect(received).not.toHaveProperty('totalPrice');
  expect(received).not.toHaveProperty('coinsDeducted');
  expect(received).not.toHaveProperty('durationMinutes');
});

test('completes a scheduled video booking with the backend format surcharge', async ({ page, context }) => {
  await authenticateCustomer(context);
  let received: Record<string, unknown> | undefined;
  await page.route('**/api/backend/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    let body: unknown = {};
    if (path === '/api/backend/booking-catalog') body = catalog;
    else if (path === '/api/backend/booking-catalog/quote') body = { sessionModel: 'legacy_timed', depth: 'entry', format: 'video', durationMinutes: 15, totalPrice: 301, coinsDeducted: 301 };
    else if (path === '/api/backend/experts/expert-a') body = expert;
    else if (path === '/api/backend/experts/expert-a/all-slots') body = [{ startTime: '2026-11-20T04:30:00.000Z', status: 'available' }];
    else if (path === '/api/backend/wallet') body = { coinBalance: 500, transactions: [] };
    else if (path === '/api/backend/bookings' && request.method() === 'POST') {
      received = request.postDataJSON();
      body = { id: 'video-booking', panditId: 'expert-a', startTime: '2026-11-20T04:30:00.000Z', durationMinutes: 15, totalPrice: 301, coinsDeducted: 301, status: 'confirmed' };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto('/bookings/new?expertId=expert-a');
  await page.getByLabel('Topic').selectOption('career');
  await page.getByLabel('Session depth').selectOption('entry');
  await page.getByLabel('Format').selectOption('video');
  await page.getByRole('textbox', { name: 'Date' }).fill('2026-11-20');
  await page.getByRole('button', { name: /10:00 am/i }).click();
  await expect(page.getByText('301 coins', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Review booking', exact: true }).click();
  await page.getByRole('button', { name: /Confirm booking/ }).click();
  await expect(page).toHaveURL(/\/bookings\/video-booking$/);
  expect(received).toMatchObject({ panditId: 'expert-a', area: 'career', depth: 'entry', format: 'video', sessionModel: 'legacy_timed' });
  expect(received).not.toHaveProperty('totalPrice');
  expect(received).not.toHaveProperty('coinsDeducted');
  expect(received).not.toHaveProperty('durationMinutes');
});

test('stops before confirmation and offers wallet recovery when balance is too low', async ({ page, context }) => {
  await authenticateCustomer(context);
  await page.route('**/api/backend/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    let body: unknown = {};
    if (path === '/api/backend/booking-catalog') body = catalog;
    else if (path === '/api/backend/booking-catalog/quote') body = { sessionModel: 'legacy_timed', depth: 'entry', format: 'audio', durationMinutes: 15, totalPrice: 151, coinsDeducted: 151 };
    else if (path === '/api/backend/experts/expert-a') body = expert;
    else if (path === '/api/backend/experts/expert-a/all-slots') body = [{ startTime: '2026-11-20T04:30:00.000Z', status: 'available' }];
    else if (path === '/api/backend/wallet') body = { coinBalance: 0, transactions: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto('/bookings/new?expertId=expert-a');
  await page.getByRole('textbox', { name: 'Date' }).fill('2026-11-20');
  await page.getByRole('button', { name: /10:00 am/i }).click();
  await page.getByRole('button', { name: 'Review booking', exact: true }).click();
  await expect(page.getByRole('alert').getByText('Not enough coins to confirm.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Add coins' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Confirm booking/ })).toBeDisabled();
});

test('starts Chat Now from the backend presence and quote', async ({ page, context }) => {
  await authenticateCustomer(context);
  let received: Record<string, unknown> | undefined;
  await page.route('**/api/backend/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    let body: unknown = {};
    if (path === '/api/backend/booking-catalog') body = catalog;
    else if (path === '/api/backend/booking-catalog/quote') body = { sessionModel: 'legacy_timed', depth: 'entry', format: 'chat', durationMinutes: 15, totalPrice: 101, coinsDeducted: 101 };
    else if (path === '/api/backend/experts/expert-a') body = expert;
    else if (path === '/api/backend/bookings/pandit/expert-a/status') body = { panditId: 'expert-a', state: 'available', activeBookingId: null, estimatedAvailableAt: null, queueLength: 0, maxQueueDepth: 5, canJoinQueue: false };
    else if (path === '/api/backend/wallet') body = { coinBalance: 500, transactions: [] };
    else if (path === '/api/backend/bookings/chat-now' && request.method() === 'POST') {
      received = request.postDataJSON();
      body = { id: 'chat-now-1', panditId: 'expert-a', startTime: '2026-11-16T10:00:00.000Z', durationMinutes: 15, totalPrice: 101, coinsDeducted: 101, status: 'confirmed' };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto('/bookings/new?expertId=expert-a&mode=chat-now', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Start a Chat Now conversation', exact: true })).toBeVisible();
  await expect(page.getByText('15 minutes')).toBeVisible();
  await expect(page.getByText('101 coins', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start Chat Now', exact: true }).click();
  await expect(page.getByRole('button', { name: /Start Chat Now/ })).toBeVisible();
  const terms = page.getByRole('region', { name: 'Cancellation and refund terms' });
  await expect(terms).toContainText('does not join within 10 minutes');
  await expect(terms).toContainText('90 seconds');
  await page.getByRole('button', { name: /Start Chat Now/ }).click();
  await expect(page).toHaveURL(/\/bookings\/chat-now-1$/);
  expect(received).toMatchObject({ panditId: 'expert-a', area: 'career' });
  expect(received).not.toHaveProperty('totalPrice');
  expect(received).not.toHaveProperty('durationMinutes');
});

test('uses the backend queue estimate for a busy Chat Now Pandit without charging', async ({ page, context }) => {
  await authenticateCustomer(context);
  let queueRequest: Record<string, unknown> | undefined;
  let bookingCreated = false;
  await page.route('**/api/backend/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    let body: unknown = {};
    if (path === '/api/backend/booking-catalog') body = catalog;
    else if (path === '/api/backend/booking-catalog/quote') body = { sessionModel: 'legacy_timed', depth: 'entry', format: 'chat', durationMinutes: 15, totalPrice: 101, coinsDeducted: 101 };
    else if (path === '/api/backend/experts/expert-a') body = expert;
    else if (path === '/api/backend/bookings/pandit/expert-a/status') body = { panditId: 'expert-a', state: 'busy', activeBookingId: 'existing-booking', estimatedAvailableAt: null, queueLength: 2, maxQueueDepth: 5, canJoinQueue: true };
    else if (path === '/api/backend/wallet') body = { coinBalance: 500, transactions: [] };
    else if (path === '/api/backend/bookings/chat-now/queue' && request.method() === 'POST') {
      queueRequest = request.postDataJSON();
      body = { position: 3, estimatedWaitMinutes: 45, queueLength: 3 };
    } else if (path === '/api/backend/bookings/chat-now/queue' && request.method() === 'GET') {
      body = { position: 3, estimatedWaitMinutes: 45, queueLength: 3 };
    } else if (path === '/api/backend/bookings/chat-now' && request.method() === 'POST') {
      bookingCreated = true;
      body = { id: 'unexpected-booking', panditId: 'expert-a', startTime: '2026-11-16T10:00:00.000Z', durationMinutes: 15, totalPrice: 101, coinsDeducted: 101, status: 'confirmed' };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto('/bookings/new?expertId=expert-a&mode=chat-now', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Join the Chat Now queue', exact: true }).click();
  await expect(page.getByText('You are #3 in line · estimated wait 45 minutes.', { exact: true })).toBeVisible();
  expect(queueRequest).toEqual({ panditId: 'expert-a' });
  expect(bookingCreated).toBe(false);
});

