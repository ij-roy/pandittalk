const claimedLaunches = new Set<string>();

export function notificationLaunchKey(identifier: string, actionIdentifier: string): string {
  return `${identifier}:${actionIdentifier}`;
}

function readBookingId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function bookingIdFromNotificationData(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const direct = readBookingId(record.bookingId) ?? readBookingId(record.booking_id);
  if (direct) return direct;
  if (typeof record.data === 'string') {
    try {
      return bookingIdFromNotificationData(JSON.parse(record.data));
    } catch {
      return null;
    }
  }
  if (record.data && typeof record.data === 'object') {
    return bookingIdFromNotificationData(record.data);
  }
  return null;
}

export function claimNotificationBooking(
  identifier: string,
  actionIdentifier: string,
  data: unknown,
): string | null {
  const bookingId = bookingIdFromNotificationData(data);
  if (!bookingId) return null;
  const key = notificationLaunchKey(identifier, actionIdentifier);
  if (claimedLaunches.has(key)) return null;
  claimedLaunches.add(key);
  return bookingId;
}
