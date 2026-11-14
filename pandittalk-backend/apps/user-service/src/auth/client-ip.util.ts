import type { Request } from 'express';

/**
 * Client IP from Express `req.ip` (honours `trust proxy`).
 * Do not read leftmost `X-Forwarded-For` — that value is client-spoofable.
 */
export function clientIp(req: Request): string {
  const ip = req.ip?.trim();
  if (ip) {
    return ip;
  }
  const remote = req.socket.remoteAddress?.trim();
  return remote || 'unknown';
}
