import type { Request, Response } from 'express';

export const REFRESH_COOKIE_NAME = 'pt_refresh';

export type RefreshCookieOptions = {
  maxAgeSeconds: number;
  secure: boolean;
};

export function readRefreshCookie(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) {
    return undefined;
  }
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const name = trimmed.slice(0, eq);
    if (name !== REFRESH_COOKIE_NAME) {
      continue;
    }
    return decodeURIComponent(trimmed.slice(eq + 1));
  }
  return undefined;
}

export function setRefreshCookie(
  res: Response,
  token: string,
  options: RefreshCookieOptions,
): void {
  const sameSite = options.secure ? 'None' : 'Lax';
  const parts = [
    `${REFRESH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/auth',
    `Max-Age=${options.maxAgeSeconds}`,
    'HttpOnly',
    `SameSite=${sameSite}`,
  ];
  if (options.secure) {
    parts.push('Secure');
  }
  res.append('Set-Cookie', parts.join('; '));
}

export function clearRefreshCookie(res: Response, secure: boolean): void {
  const sameSite = secure ? 'None' : 'Lax';
  const parts = [
    `${REFRESH_COOKIE_NAME}=`,
    'Path=/auth',
    'Max-Age=0',
    'HttpOnly',
    `SameSite=${sameSite}`,
  ];
  if (secure) {
    parts.push('Secure');
  }
  res.append('Set-Cookie', parts.join('; '));
}
