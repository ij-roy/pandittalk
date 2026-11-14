import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pandittalk.dailyHoroscopeStreak';
const DAY_MS = 86_400_000;

export type HoroscopeStreak = {
  count: number;
  lastDate: string | null;
};

const EMPTY: HoroscopeStreak = { count: 0, lastDate: null };

export function todayKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseYmd(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function isPreviousDay(previous: string, today: string): boolean {
  const from = parseYmd(previous);
  const to = parseYmd(today);
  if (!from || !to) return false;
  const fromUtc = Date.UTC(from.y, from.m - 1, from.d);
  const toUtc = Date.UTC(to.y, to.m - 1, to.d);
  return toUtc - fromUtc === DAY_MS;
}

/** Count still worth showing before today's visit. A gap of more than one day resets it. */
export function visibleStreak(state: HoroscopeStreak, today: string): number {
  if (!state.lastDate || state.count < 1) return 0;
  if (state.lastDate === today || isPreviousDay(state.lastDate, today)) return state.count;
  return 0;
}

/** Record one free daily horoscope open. Same calendar day does not increase the count. */
export function recordHoroscopeDay(state: HoroscopeStreak, today: string): HoroscopeStreak {
  if (state.lastDate === today && state.count > 0) return state;
  if (state.lastDate && isPreviousDay(state.lastDate, today)) {
    return { count: state.count + 1, lastDate: today };
  }
  return { count: 1, lastDate: today };
}

export function streakLabel(count: number): string {
  if (count <= 0) return 'Open today’s horoscope to start a streak.';
  if (count === 1) return '1 day streak';
  return `${count} day streak`;
}

function parseStored(raw: string | null): HoroscopeStreak {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return EMPTY;
    const record = parsed as { count?: unknown; lastDate?: unknown };
    const count = typeof record.count === 'number' && record.count > 0 ? Math.floor(record.count) : 0;
    const lastDate = typeof record.lastDate === 'string' ? record.lastDate : null;
    return { count, lastDate };
  } catch {
    return EMPTY;
  }
}

export async function readHoroscopeStreak(): Promise<HoroscopeStreak> {
  try {
    return parseStored(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY;
  }
}

export async function markDailyHoroscopeOpened(now = new Date()): Promise<HoroscopeStreak> {
  const today = todayKey(now);
  const next = recordHoroscopeDay(await readHoroscopeStreak(), today);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // The reading still opens if storage fails.
  }
  return next;
}
