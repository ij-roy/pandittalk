import { NextResponse } from 'next/server';
export function failure(status: number, message: string, code?: string) {
  return NextResponse.json({ message, code }, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
export function backendOrigin(): string | null {
  // Vercel deployments historically carried the public API base variables while
  // BACKEND_URL was only present in local/staging env files. Keep the proxy
  // server-side and accept the configured API base as a compatibility fallback.
  const raw = process.env.BACKEND_URL || process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE;
  if (!raw) return null;
  try { const url = new URL(raw); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash ? url.toString().replace(/\/$/, '') : null; } catch { return null; }
}
export function requestOrigin(request: Request) { return process.env.APP_ORIGIN || new URL(request.url).origin; }
export async function upstream(path: string, options: RequestInit = {}) {
  const base = backendOrigin();
  if (!base) throw new Error('Backend unavailable');
  return fetch(`${base}${path}`, { ...options, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(25000) });
}
export function safeServiceError(status: number): string {
  if (status === 401) return 'Please sign in again to continue.';
  if (status === 403) return 'You do not have access to this action.';
  if (status === 404) return 'This record is unavailable or is not yours.';
  if (status === 409) return 'This has changed. Refresh before trying again.';
  if (status === 429) return 'Too many attempts. Please wait before trying again.';
  if (status === 400 || status === 422) return 'The details could not be accepted. Check your entries or refresh the current status.';
  return 'The service is unavailable. Nothing has been confirmed. Please check the current status before repeating a purchase.';
}
