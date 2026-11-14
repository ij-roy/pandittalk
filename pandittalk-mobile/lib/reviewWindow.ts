const DAY_MS = 24 * 60 * 60 * 1000;

export function reviewWindowNote(endedAt: Date | null, now = new Date()): string {
  if (!endedAt || Number.isNaN(endedAt.getTime())) {
    return 'You can rate this any time after the session ends.';
  }
  const days = Math.floor((now.getTime() - endedAt.getTime()) / DAY_MS);
  if (days <= 0) return 'You can rate this session today, or any time later.';
  if (days === 1) return 'This ended yesterday. You can still rate it.';
  return `This ended ${days} days ago. You can still rate it.`;
}

export function sessionEndedAt(startIso: string | null, durationMinutes: number): Date | null {
  if (!startIso) return null;
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return null;
  const minutes = Number.isFinite(durationMinutes) ? durationMinutes : 0;
  return new Date(start.getTime() + minutes * 60 * 1000);
}
