import { NextRequest, NextResponse } from 'next/server';
import { allowedEndpoint, trustedMutation } from '@/lib/api/security';
import { backendOrigin, failure, requestOrigin, safeServiceError, upstream } from '@/lib/api/server';
import { readSession, SESSION_COOKIE, sessionCookieOptions } from '@/features/auth/session';
export const dynamic = 'force-dynamic';
async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await context.params;
  const path = '/' + parts.join('/');
  if (!allowedEndpoint(request.method, path)) return failure(404, 'This service route is unavailable.');
  if (request.method !== 'GET' && !trustedMutation(requestOrigin(request), request.headers.get('origin'), request.headers.get('content-type'))) return failure(403, 'Please submit this action from the website.');
  const session = await readSession();
  const publicRoute = request.method === 'GET' && path.startsWith('/experts') || request.method === 'POST' && (/^\/tools\/(kundli|horoscope|compatibility|tarot|palm-reading)$/.test(path) || path === '/pandit-applications');
  if (!publicRoute && !session) return failure(401, 'Please sign in to continue.');
  if (!backendOrigin()) return failure(503, 'The service connection is not configured for this preview.', 'BACKEND_UNCONFIGURED');
  // No environment toggle can turn legacy timed contracts into the reviewed offer.
  if (request.method === 'POST' && /^\/bookings(?:\/chat-now(?:\/queue)?)?$/.test(path)) return failure(503, 'New conversations need the approved No Timer service contract before booking can open. You will not be charged.', 'NO_TIMER_CONTRACT_REQUIRED');
  if (request.method === 'POST' && /^\/tools\/(unlock|monthly-horoscope)$/.test(path)) return failure(503, 'Paid report unlock is temporarily unavailable. You will not be charged.', 'PAID_REPORT_CONTRACT_REQUIRED');
  if (path === '/wallet/create-order' && process.env.PAYMENTS_TEST_ENABLED !== 'true') return failure(503, 'Recharge is not enabled in this preview. You will not be charged. Existing wallet records remain available.', 'PAYMENTS_DISABLED');
  if (request.method === 'DELETE' && path === '/users/profile' && (!session || Date.now() - session.authenticatedAt > 5 * 60 * 1000)) return failure(403, 'Please sign in again immediately before deleting your account.', 'REAUTH_REQUIRED');
  const headers = new Headers();
  if (session) headers.set('Authorization', `Bearer ${session.accessToken}`);
  let body: ArrayBuffer | undefined;
  if (request.method !== 'GET') {
    const limit = path.endsWith('/avatar') ? 5.1 * 1024 * 1024 : 1024 * 1024;
    if (Number(request.headers.get('content-length') || 0) > limit) return failure(413, 'This upload is too large.');
    body = await request.arrayBuffer();
    if (body.byteLength > limit) return failure(413, 'This upload is too large.');
    headers.set('Content-Type', request.headers.get('content-type') || 'application/json');
    if (!path.endsWith('/avatar')) {
      try {
        const payload = JSON.parse(new TextDecoder().decode(body) || '{}');
        if (path.startsWith('/tools/') && payload.detailed === true) return failure(503, 'New detailed readings are awaiting a verified purchase contract.');
      } catch { return failure(400, 'Please provide valid form details.'); }
    }
  }
  const query = new URLSearchParams();
  // Private text, auth and arbitrary upstream parameters never pass through a URL.
  for (const name of ['search','area','date','limit','offset','page','status']) {
    const value = request.nextUrl.searchParams.get(name);
    if (value && value.length <= 150 && request.method === 'GET') query.set(name, value);
  }
  try {
    const result = await upstream(path + (query.size ? `?${query}` : ''), { method: request.method, headers, body });
    if (!result.ok) return failure(result.status, safeServiceError(result.status));
    const payload = await result.json();
    if (path === '/wallet/create-order' && (typeof payload.keyId !== 'string' || !payload.keyId.startsWith('rzp_test_'))) return failure(503, 'Only Razorpay test mode is allowed in this review build. No checkout was opened.');
    const response = NextResponse.json(payload, { headers: { 'Cache-Control': 'private, no-store' } });
    if (request.method === 'DELETE' && path === '/users/profile' && payload.success === true) response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0));
    return response;
  } catch { return failure(503, 'We could not confirm the outcome. Refresh the record before repeating this action.'); }
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
