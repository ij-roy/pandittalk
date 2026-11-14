import { createCipheriv, randomBytes } from 'node:crypto';
import type { BrowserContext } from '@playwright/test';

// Synthetic local UI-test sessions only. Never configure a deployed app with this key.
export const UI_SESSION_SECRET = 'f'.repeat(64);

export async function authenticateCustomer(context: BrowserContext) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(UI_SESSION_SECRET, 'hex'), iv);
  const session = { accessToken: 'ui-fixture-access', refreshToken: 'ui-fixture-refresh', expiresAt: Date.now() + 3_600_000, authenticatedAt: Date.now() };
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(session), 'utf8'), cipher.final()]);
  const value = Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
  await context.addCookies([{ name: 'pt_session', value, url: process.env.UI_BASE_URL || 'http://localhost:3000', httpOnly: true, sameSite: 'Lax' }]);
}
