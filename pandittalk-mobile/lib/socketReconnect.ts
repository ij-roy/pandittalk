const BASE_MS = 2_000;
const MAX_MS = 30_000;
const STABLE_MS = 10_000;

export function nextReconnectDelayMs(attempt: number): number {
  const step = Math.max(0, Math.floor(attempt));
  const doubled = BASE_MS * 2 ** Math.min(step, 8);
  return Math.min(MAX_MS, doubled);
}

/** A connection that stayed up resets the backoff. A short blip does not. */
export function shouldResetReconnectAttempt(connectedMs: number): boolean {
  return connectedMs >= STABLE_MS;
}
