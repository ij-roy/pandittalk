import axios from 'axios';
import { INDIAN_CITIES } from '../constants/indianCities';

export const MARITAL_STATUS_OPTIONS = [
  { label: 'Single', value: 'single' },
  { label: 'Married', value: 'married' },
  { label: 'Divorced', value: 'divorced' },
  { label: 'Widowed', value: 'widowed' },
] as const;

export type MaritalStatusValue = (typeof MARITAL_STATUS_OPTIONS)[number]['value'];

export const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' as const, icon: 'mars' as const },
  { label: 'Female', value: 'female' as const, icon: 'venus' as const },
  { label: 'Other', value: 'other' as const, icon: 'transgender' as const },
] as const;

export type GenderOption = (typeof GENDER_OPTIONS)[number]['value'];

const LEGACY_CITY_SLUGS: Record<string, string> = {
  delhi: 'Delhi',
  mumbai: 'Mumbai',
  pune: 'Pune',
  jaipur: 'Jaipur',
};

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export function formatDateLabel(date: Date): string {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = MONTH_LABELS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatTimeLabel(date: Date): string {
  const hours24 = date.getHours();
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${`${hours12}`.padStart(2, '0')}:${minutes} ${suffix}`;
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(date: Date): string {
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatTimeForApi(d: Date): string {
  const h = `${d.getHours()}`.padStart(2, '0');
  const m = `${d.getMinutes()}`.padStart(2, '0');
  return `${h}:${m}`;
}

export function coerceProfileRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const inner = o.user ?? o.data ?? o.profile;
  if (inner && typeof inner === 'object') return inner as Record<string, unknown>;
  return o;
}

export function readStr(r: Record<string, unknown>, key: string): string | undefined {
  const v = r[key];
  return typeof v === 'string' ? v : undefined;
}

export function normalizeGender(raw: string | undefined): GenderOption | null {
  if (!raw) return null;
  const x = raw.toLowerCase().trim();
  if (x === 'male' || x === 'female' || x === 'other') return x;
  return null;
}

export function normalizeMaritalStatus(raw: string | undefined): MaritalStatusValue | null {
  if (!raw) return null;
  const x = raw.toLowerCase().trim();
  for (const opt of MARITAL_STATUS_OPTIONS) {
    if (opt.value === x) return opt.value;
  }
  return null;
}

/** Maps API / legacy slug strings to display city names when possible. */
export function normalizeCityValue(raw: string | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (LEGACY_CITY_SLUGS[lower]) return LEGACY_CITY_SLUGS[lower];
  const match = INDIAN_CITIES.find(
    (c) => c.name.toLowerCase() === lower,
  );
  return match?.name ?? t;
}

export function parseYmdToDate(ymd: string | undefined): Date | null {
  if (!ymd) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function applyClockStringToDate(base: Date, timeVal: string | undefined): Date {
  if (!timeVal) return base;
  const trimmed = timeVal.trim();
  if (/^\d{1,2}:\d{2}/.test(trimmed)) {
    const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(trimmed);
    if (m) {
      const next = new Date(base);
      next.setHours(Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : 0, 0);
      return next;
    }
    return base;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? base : parsed;
}

export function localDigitsFromPhone(phone: string | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function messageFromAxiosError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: string } | undefined;
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  const code = (err as { code?: string } | null)?.code;
  if (typeof code === 'string') {
    if (code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      return 'Google Play Services is missing or needs an update. Use mobile OTP instead.';
    }
    if (code === 'DEVELOPER_ERROR' || code === 'INTERNAL_ERROR') {
      return 'Google Sign-In is unavailable on this install. Use mobile OTP instead.';
    }
  }
  return 'Could not save profile. Please try again.';
}

export function mergeCoinBalanceIntoRecord(
  raw: unknown,
  record: Record<string, unknown>,
): Record<string, unknown> {
  if (record.coinBalance != null || record.coin_balance != null) return record;
  if (!raw || typeof raw !== 'object') return record;
  const visit = (node: unknown): number | undefined => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return undefined;
    const o = node as Record<string, unknown>;
    const b = o.coinBalance ?? o.coin_balance;
    if (typeof b === 'number' && Number.isFinite(b)) return b;
    if (typeof b === 'string' && b.trim()) {
      const n = Number(b);
      if (Number.isFinite(n)) return n;
    }
    return undefined;
  };
  const o = raw as Record<string, unknown>;
  const balance =
    visit(o) ?? visit(o.data) ?? visit(o.user) ?? visit(o.profile);
  return balance !== undefined ? { ...record, coinBalance: balance } : record;
}
