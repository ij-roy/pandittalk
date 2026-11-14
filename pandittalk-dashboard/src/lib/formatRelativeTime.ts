const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Returns strings like "5 min ago", "2 hours ago", "3 days ago". */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const diffMs = Date.now() - then;
  if (diffMs < 0) return 'just now';

  if (diffMs < MINUTE_MS) return 'just now';

  const minutes = Math.floor(diffMs / MINUTE_MS);
  if (minutes < 60) {
    return minutes === 1 ? '1 min ago' : `${minutes} min ago`;
  }

  const hours = Math.floor(diffMs / HOUR_MS);
  if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  const days = Math.floor(diffMs / DAY_MS);
  if (days < 7) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }

  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}
