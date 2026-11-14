import { NextRequest, NextResponse } from 'next/server';
import { normalizePhone, trustedMutation } from '@/lib/api/security';
import { backendOrigin, failure, requestOrigin, safeServiceError, upstream } from '@/lib/api/server';
import { readSession, sealSession, SESSION_COOKIE, sessionCookieOptions } from '@/features/auth/session';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (action === 'config') return NextResponse.json({
    configured: !!backendOrigin() && !!process.env.SESSION_SECRET,
    googleClientId: process.env.GOOGLE_WEB_CLIENT_ID || null,
    appleClientId: process.env.APPLE_WEB_CLIENT_ID || null,
    appleRedirectUri: process.env.APPLE_WEB_REDIRECT_URI || null,
  }, { headers: { 'Cache-Control': 'no-store' } });
  if (action === 'session') return NextResponse.json({ signedIn: !!await readSession() }, { headers: { 'Cache-Control': 'private, no-store' } });
  return failure(404, 'This sign-in action is unavailable.');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!['request-otp','verify-otp','google','apple','complete-social','refresh','logout'].includes(action)) return failure(404, 'This sign-in action is unavailable.');
  if (!trustedMutation(requestOrigin(request), request.headers.get('origin'), request.headers.get('content-type'))) return failure(403, 'Please sign in from the website.');
  if (Number(request.headers.get('content-length') || 0) > 20000) return failure(413, 'The sign-in request is too large.');
  const current = await readSession();
  let payload: Record<string, unknown>;
  try { const text = await request.text(); if (text.length > 20000) return failure(413, 'The sign-in request is too large.'); payload = JSON.parse(text || '{}'); } catch { return failure(400, 'Please check the sign-in details.'); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return failure(400, 'Please check the sign-in details.');
  if (['request-otp','verify-otp','complete-social'].includes(action)) {
    const phone = normalizePhone(typeof payload.phoneNumber === 'string' ? payload.phoneNumber : '');
    if (!phone) return failure(400, 'Enter a valid Indian mobile number.');
    payload.phoneNumber = phone;
  }
  if (['verify-otp','complete-social'].includes(action) && !/^\d{4}$/.test(String(payload.otp))) return failure(400, 'Enter the four-digit code.');
  if (['verify-otp','google','apple'].includes(action) && payload.acceptedLegalConsent !== true) return failure(400, 'Confirm that you are 18 or older and accept the terms and privacy policy.');
  if (action === 'google' && !process.env.GOOGLE_WEB_CLIENT_ID || action === 'apple' && !process.env.APPLE_WEB_CLIENT_ID) return failure(503, 'This browser sign-in method is not configured yet. You can use your phone number.');
  if (['refresh','logout'].includes(action)) payload = { refreshToken: current?.refreshToken };
  if (action === 'refresh' && !current) return failure(401, 'Please sign in again.');
  // Browser Web Locks serialize tab refreshes. A tab that received the rotated
  // cookie must not consume its successor again unnecessarily.
  if (action === 'refresh' && current) {
    try { const jwt = JSON.parse(Buffer.from(current.accessToken.split('.')[1], 'base64url').toString());
      if (Number(jwt.exp) * 1000 > Date.now() + 30000) return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
    } catch { /* let the identity service determine the session */ }
  }
  if (!backendOrigin() || !process.env.SESSION_SECRET) {
    const response = failure(503, 'Sign-in needs the staging service connection. No account action has been completed.');
    if (action === 'logout') response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0));
    return response;
  }
  try {
    const result = await upstream(`/auth/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!result.ok) {
      const response = failure(result.status, result.status === 401 && action === 'verify-otp' ? 'That code is incorrect or has expired. Request a new code.' : safeServiceError(result.status));
      if (action === 'logout' || action === 'refresh' && result.status === 401) response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0));
      const retry = result.headers.get('retry-after'); if (retry && /^\d+$/.test(retry)) response.headers.set('Retry-After', retry);
      return response;
    }
    const value = await result.json();
    if (action === 'logout') { const response = NextResponse.json({ success: true }); response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0)); return response; }
    if (action === 'request-otp') {
      const deliveryNote =
        typeof value.message === 'string' && /not sent|allowlisted|test number/i.test(value.message)
          ? value.message
          : null;
      return NextResponse.json(
        { success: true, ...(deliveryNote ? { message: deliveryNote } : {}) },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (value.needsPhone === true && typeof value.pendingToken === 'string') return NextResponse.json({ needsPhone: true, pendingToken: value.pendingToken }, { headers: { 'Cache-Control': 'no-store' } });
    if (typeof value.accessToken !== 'string' || typeof value.refreshToken !== 'string' || !Number.isInteger(value.refreshMaxAgeSeconds) || value.refreshMaxAgeSeconds <= 0) return failure(502, 'Sign-in returned an incomplete session. Please try again.');
    const maxAge = value.refreshMaxAgeSeconds;
    const sealed = sealSession({ accessToken: value.accessToken, refreshToken: value.refreshToken, expiresAt: Date.now() + maxAge * 1000, authenticatedAt: action === 'refresh' && current ? current.authenticatedAt : Date.now() });
    if (sealed.length > 3800) return failure(502, 'The browser session could not be stored safely.');
    const response = NextResponse.json({ success: true, hasProfile: value.hasProfile }, { headers: { 'Cache-Control': 'private, no-store' } });
    response.cookies.set(SESSION_COOKIE, sealed, sessionCookieOptions(maxAge));
    return response;
  } catch {
    const response = failure(503, 'We could not reach sign-in. Please try again.');
    if (action === 'logout') response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0));
    return response;
  }
}
