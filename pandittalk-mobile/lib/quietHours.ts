export const QUIET_HOURS_START = 22;
export const QUIET_HOURS_END = 7;

export const QUIET_HOURS_NOTE =
  'From 10:00 PM to 7:00 AM IST, the daily horoscope stays quiet and the 30-minute session reminder is skipped. A 10-minute reminder, a 5-minute reminder, and chat alerts still arrive.';

export function istHour(date: Date): number {
  const part = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .find((item) => item.type === 'hour')?.value;
  const hour = Number(part);
  return Number.isFinite(hour) ? hour : date.getUTCHours();
}

export function isQuietHour(hour: number, enabled: boolean): boolean {
  if (!enabled) return false;
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return false;
  return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
}

export function shouldHoldMarketingAlert(
  type: string | undefined,
  enabled: boolean,
  hour: number,
): boolean {
  if (type !== 'daily_horoscope') return false;
  return isQuietHour(hour, enabled);
}

/** The earliest session ping is the extra one. Closer reminders still fire. */
export function shouldSkipQuietReminder(minutesBefore: number, inQuietHours: boolean): boolean {
  return inQuietHours && minutesBefore >= 30;
}
