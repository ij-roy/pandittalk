/** Seekers treat a pandit as online only after a recent dashboard heartbeat. */
export const PRESENCE_STALE_MS = 2 * 60 * 1000;

export function isPanditPresent(
  pandit: { isOnline: boolean; presenceSeenAt: Date | null },
  now = Date.now(),
): boolean {
  if (!pandit.isOnline || pandit.presenceSeenAt == null) return false;
  const seen = pandit.presenceSeenAt.getTime();
  if (!Number.isFinite(seen)) return false;
  return now - seen <= PRESENCE_STALE_MS;
}
