import { NextRequest, NextResponse } from 'next/server';

/**
 * Customer + auth-route headers — not access control.
 * Auth redirects live in (customer)/layout.tsx.
 * Global frame/referrer/nosniff headers are owned by next.config.ts.
 * Content-Security-Policy is deferred (not set here).
 *
 * Auth matchers add X-Robots-Tag so disallowed login/OTP surfaces stay noindex
 * even when a crawler ignores robots.txt paths.
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthSurface =
    path.startsWith('/login')
    || path.startsWith('/verify-otp')
    || path.startsWith('/link-phone');
  const headers = new Headers(request.headers);
  // Only customer layouts read this for post-login returnTo.
  if (!isAuthSurface) headers.set('x-customer-path', path);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  const isSession = path.startsWith('/sessions/');
  // Session pages need camera/mic; auth and other customer surfaces do not.
  response.headers.set(
    'Permissions-Policy',
    isSession && !isAuthSurface
      ? 'geolocation=(), payment=()'
      : 'camera=(), microphone=(), geolocation=(), payment=()',
  );
  return response;
}

export const config = {
  matcher: [
    '/home/:path*',
    '/account/:path*',
    '/wallet/:path*',
    '/bookings/:path*',
    '/sessions/:path*',
    '/reports/:path*',
    '/notifications/:path*',
    '/profile-setup',
    '/profile-setup/:path*',
    '/login',
    '/login/:path*',
    '/verify-otp',
    '/verify-otp/:path*',
    '/link-phone',
    '/link-phone/:path*',
  ],
};
