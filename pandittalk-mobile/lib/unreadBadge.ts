/** A count from a fetch that started before a newer read is ignored. */
export function acceptUnreadCount(
  currentEpoch: number,
  startedEpoch: number,
  incoming: number,
): number | null {
  if (startedEpoch !== currentEpoch) return null;
  if (!Number.isFinite(incoming)) return null;
  return Math.max(0, Math.floor(incoming));
}
