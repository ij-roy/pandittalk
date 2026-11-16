export function scheduledNoShowDelayMs(
  startTime: Date,
  now: Date,
  noShowMinutes: number,
): number {
  const startMs = startTime.getTime();
  const nowMs = now.getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(nowMs)) return 0;

  const windowMs = Math.max(0, noShowMinutes) * 60 * 1000;
  return Math.max(0, startMs + windowMs - nowMs);
}

export function shouldRefundScheduledNoShow(input: {
  startTime: Date;
  now: Date;
  noShowMinutes: number;
  sessionStarted: boolean;
  participantCount: number;
}): boolean {
  if (input.sessionStarted || input.participantCount >= 2) return false;
  return (
    scheduledNoShowDelayMs(input.startTime, input.now, input.noShowMinutes) ===
    0
  );
}
