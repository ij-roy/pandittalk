const IST_TIMEZONE = 'Asia/Kolkata';

const istYmdFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: IST_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const istDateFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

export function formatIST(iso: string): string {
  return istDateFormatter.format(new Date(iso));
}

export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

export function isTodayIST(iso: string): boolean {
  const date = new Date(iso);
  const todayYmd = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const bookingYmd = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  return todayYmd === bookingYmd;
}

export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const dobFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatDateOfBirth(iso: string): string {
  return dobFormatter.format(new Date(iso));
}

export function getISTYmd(date: Date = new Date()): string {
  return istYmdFormatter.format(date);
}

function getISTWeekdayIndex(date: Date = new Date()): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    weekday: 'short',
  }).format(date);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[weekday] ?? 0;
}

function ymdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function addDaysToYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return istYmdFormatter.format(new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0)));
}

export interface WeekDay {
  ymd: string;
  date: Date;
}

export function getCurrentWeekDaysIST(reference: Date = new Date()): WeekDay[] {
  const todayYmd = getISTYmd(reference);
  const mondayYmd = addDaysToYmd(todayYmd, -getISTWeekdayIndex(reference));

  return Array.from({ length: 7 }, (_, i) => {
    const ymd = addDaysToYmd(mondayYmd, i);
    return { ymd, date: ymdToDate(ymd) };
  });
}

/** Shift the week containing `reference` by `weekOffset` weeks (negative = past). */
export function getWeekDaysIST(
  reference: Date = new Date(),
  weekOffset = 0,
): WeekDay[] {
  const base = getCurrentWeekDaysIST(reference);
  if (weekOffset === 0) return base;
  const mondayYmd = addDaysToYmd(base[0].ymd, weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const ymd = addDaysToYmd(mondayYmd, i);
    return { ymd, date: ymdToDate(ymd) };
  });
}

const weekRangeDateFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIMEZONE,
  day: 'numeric',
  month: 'short',
});

const weekRangeYearFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIMEZONE,
  year: 'numeric',
});

export function formatWeekRange(monYmd: string, sunYmd: string): string {
  const monStr = weekRangeDateFormatter.format(ymdToDate(monYmd));
  const sunStr = weekRangeDateFormatter.format(ymdToDate(sunYmd));
  const year = weekRangeYearFormatter.format(ymdToDate(sunYmd));
  return `${monStr} – ${sunStr} ${year}`;
}

const dayHeaderFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIMEZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'short',
});

export function formatDayHeader(ymd: string): string {
  return dayHeaderFormatter.format(ymdToDate(ymd));
}

const istTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIMEZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function formatTimeIST(iso: string): string {
  return istTimeFormatter.format(new Date(iso));
}

export function isPastDayIST(ymd: string, now: Date = new Date()): boolean {
  return ymd < getISTYmd(now);
}

export function isFutureDayIST(ymd: string, now: Date = new Date()): boolean {
  return ymd > getISTYmd(now);
}

export function isTodayYmdIST(ymd: string, now: Date = new Date()): boolean {
  return ymd === getISTYmd(now);
}
