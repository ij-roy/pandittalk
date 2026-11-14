import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
export const SESSION_COOKIE = 'pt_session';
export type BrowserSession = { accessToken: string; refreshToken: string; expiresAt: number; authenticatedAt: number };
function key() {
  const value = process.env.SESSION_SECRET;
  if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) throw new Error('Session configuration unavailable');
  return Buffer.from(value, 'hex');
}
export function sealSession(session: BrowserSession): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(session), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}
export function openSession(value: string | undefined): BrowserSession | null {
  if (!value) return null;
  try {
    const buffer = Buffer.from(value, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', key(), buffer.subarray(0, 12));
    decipher.setAuthTag(buffer.subarray(12, 28));
    const session = JSON.parse(Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString('utf8')) as BrowserSession;
    if (!session.accessToken || !session.refreshToken || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now() || !Number.isFinite(session.authenticatedAt)) return null;
    return session;
  } catch { return null; }
}
export async function readSession() { return openSession((await cookies()).get(SESSION_COOKIE)?.value); }
export function sessionCookieOptions(maxAge: number) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge };
}
