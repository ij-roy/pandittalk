import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/features/auth/session';
import { failure, requestOrigin } from '@/lib/api/server';
import { trustedMutation } from '@/lib/api/security';
export async function POST(request: NextRequest) {
  if (!trustedMutation(requestOrigin(request), request.headers.get('origin'), request.headers.get('content-type'))) return failure(403, 'Open the session from this website.');
  const session = await readSession();
  if (!session) return failure(401, 'Please sign in again.');
  if (process.env.BROWSER_SESSIONS_ENABLED !== 'true' || !process.env.SOCKET_URL) return failure(503, 'Browser sessions need the staging media connection and socket origin configuration.');
  try {
    const jwt = JSON.parse(Buffer.from(session.accessToken.split('.')[1], 'base64url').toString());
    const remaining = Number(jwt.exp) * 1000 - Date.now();
    if (remaining <= 30000) return failure(401, 'Refresh your session before joining.');
    if (remaining > 15 * 60 * 1000) return failure(503, 'Browser sessions require short-lived credentials.');
  } catch { return failure(401, 'Please sign in again.'); }
  return NextResponse.json({ accessToken: session.accessToken, socketUrl: process.env.SOCKET_URL }, { headers: { 'Cache-Control': 'private, no-store' } });
}
