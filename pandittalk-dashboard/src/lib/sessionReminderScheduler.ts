export const REMINDER_THRESHOLDS_SEC = [1800, 600, 300] as const;
export type ReminderThresholdSec = (typeof REMINDER_THRESHOLDS_SEC)[number];

const shownReminders = new Set<string>();
const activeTimeouts = new Map<string, number>();

export interface ScheduleSessionRemindersOpts {
  bookingId: string;
  startsAt: string;
  onFire: (threshold: ReminderThresholdSec) => void;
}

function dedupeKey(bookingId: string, threshold: ReminderThresholdSec): string {
  return `${bookingId}-${threshold}`;
}

function clearBookingTimeouts(bookingId: string): void {
  for (const threshold of REMINDER_THRESHOLDS_SEC) {
    const key = dedupeKey(bookingId, threshold);
    const timeoutId = activeTimeouts.get(key);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      activeTimeouts.delete(key);
    }
  }
}

export function scheduleSessionReminders(
  opts: ScheduleSessionRemindersOpts,
): () => void {
  const startMs = new Date(opts.startsAt).getTime();
  if (Number.isNaN(startMs)) {
    return () => {};
  }

  const now = Date.now();

  for (const threshold of REMINDER_THRESHOLDS_SEC) {
    const key = dedupeKey(opts.bookingId, threshold);
    if (shownReminders.has(key)) continue;

    const fireAt = startMs - threshold * 1000;
    const delay = fireAt - now;
    if (delay <= 0) continue;

    const existing = activeTimeouts.get(key);
    if (existing !== undefined) {
      window.clearTimeout(existing);
    }

    const timeoutId = window.setTimeout(() => {
      activeTimeouts.delete(key);
      if (shownReminders.has(key)) return;
      shownReminders.add(key);
      opts.onFire(threshold);
    }, delay);

    activeTimeouts.set(key, timeoutId);
  }

  return () => {
    clearBookingTimeouts(opts.bookingId);
  };
}

export function scheduleSessionRemindersForBookings(
  bookings: Array<{ id: string; startsAt: string }>,
  onFire: (bookingId: string, threshold: ReminderThresholdSec) => void,
): () => void {
  const cleanups = bookings.map((booking) =>
    scheduleSessionReminders({
      bookingId: booking.id,
      startsAt: booking.startsAt,
      onFire: (threshold) => onFire(booking.id, threshold),
    }),
  );

  return () => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
}

export function hasReminderFired(
  bookingId: string,
  threshold: ReminderThresholdSec,
): boolean {
  return shownReminders.has(dedupeKey(bookingId, threshold));
}
