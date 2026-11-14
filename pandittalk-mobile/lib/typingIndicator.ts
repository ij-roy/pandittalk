/** How often this device tells the session that the draft is still changing. */
export const TYPING_EMIT_INTERVAL_MS = 2_000;

/** Hide the indicator only after typing events stop for this long. */
export const TYPING_HIDE_AFTER_MS = 8_000;

/** First keystroke sends immediately. Later keystrokes send again once the interval has passed. */
export function shouldEmitTyping(lastEmitAtMs: number | null, nowMs: number): boolean {
  if (lastEmitAtMs == null || !Number.isFinite(lastEmitAtMs)) return true;
  if (!Number.isFinite(nowMs)) return false;
  return nowMs - lastEmitAtMs >= TYPING_EMIT_INTERVAL_MS;
}
