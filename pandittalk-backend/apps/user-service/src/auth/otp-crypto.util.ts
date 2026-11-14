import { createHmac, timingSafeEqual } from 'crypto';

export function hashOtp(otp: string, secret: string): string {
  return createHmac('sha256', secret).update(otp).digest('hex');
}

/** Constant-time comparison of two hex strings. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
