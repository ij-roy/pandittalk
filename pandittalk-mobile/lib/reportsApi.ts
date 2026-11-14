import axios from 'axios';
import type { Router } from 'expo-router';

import { API_BASE } from '@/lib/authApi';
import type { MonthlyHoroscopeResponse, UnlockToolType } from '@/lib/toolsApi';

export type SavedReportType =
  | UnlockToolType
  | 'free_kundli'
  | 'free_compatibility'
  | 'daily_horoscope'
  | 'tarot'
  | 'palm_reading';

export type SavedReportSummary = {
  id: string;
  type: SavedReportType;
  title: string;
  inputSummary: string;
  coinsSpent: number;
  createdAt: string;
};

export type SavedReportDetail = SavedReportSummary & {
  payload: unknown;
};

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
}

const REPORT_TYPES = new Set<string>([
  'monthly_horoscope',
  'detailed_kundli',
  'detailed_compatibility',
  'free_kundli',
  'free_compatibility',
  'daily_horoscope',
  'tarot',
  'palm_reading',
]);

function normalizeReportType(value: unknown): SavedReportType | null {
  const key = str(value);
  if (REPORT_TYPES.has(key)) return key as SavedReportType;
  return null;
}

function normalizeSummary(raw: unknown): SavedReportSummary | null {
  const record = asRecord(raw);
  if (!record) return null;

  const id = str(record.id);
  const title = str(record.title);
  const inputSummary = str(record.inputSummary ?? record.input_summary);
  const createdAt = str(record.createdAt ?? record.created_at);
  const coinsSpent = Number(record.coinsSpent ?? record.coins_spent);

  const type = normalizeReportType(record.type);
  if (!id || !title || !createdAt || !type || Number.isNaN(coinsSpent)) return null;

  return {
    id,
    type,
    title,
    inputSummary,
    coinsSpent,
    createdAt,
  };
}

function normalizeDetail(raw: unknown): SavedReportDetail | null {
  const record = asRecord(raw);
  if (!record) return null;

  const summary = normalizeSummary(record);
  if (!summary) return null;

  return {
    ...summary,
    payload: record.payload,
  };
}

export async function getReports(accessToken: string): Promise<SavedReportSummary[]> {
  const { data } = await axios.get<unknown[]>(`${API_BASE}/reports`, {
    headers: authHeaders(accessToken),
  });
  if (!Array.isArray(data)) return [];
  return data.map(normalizeSummary).filter((item): item is SavedReportSummary => item !== null);
}

export async function getReportById(
  accessToken: string,
  reportId: string,
): Promise<SavedReportDetail> {
  const { data } = await axios.get<unknown>(`${API_BASE}/reports/${reportId}`, {
    headers: authHeaders(accessToken),
  });
  const detail = normalizeDetail(data);
  if (!detail) {
    throw new Error('Invalid report response from server.');
  }
  return detail;
}

export function reportTypeLabel(type: SavedReportType): string {
  switch (type) {
    case 'detailed_kundli':
      return 'Detailed Kundli';
    case 'detailed_compatibility':
      return 'Detailed Compatibility';
    case 'monthly_horoscope':
      return 'Month Report';
    case 'free_kundli':
      return 'Kundli';
    case 'free_compatibility':
      return 'Compatibility';
    case 'daily_horoscope':
      return 'Daily Horoscope';
    case 'tarot':
      return 'Tarot';
    case 'palm_reading':
      return 'Palm reading';
    default:
      return 'Report';
  }
}

export function formatReportDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const day = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${day}, ${time}`;
}

export function openSavedReport(router: Router, detail: SavedReportDetail): void {
  const payload = detail.payload;

  switch (detail.type) {
    case 'detailed_kundli':
      router.push({
        pathname: '/tools/kundli-detailed-result',
        params: { resultJson: JSON.stringify(payload) },
      });
      return;
    case 'detailed_compatibility': {
      const record = asRecord(payload);
      const person1Name = str(record?.person1Name);
      const person2Name = str(record?.person2Name);
      router.push({
        pathname: '/tools/compatibility-detailed-result',
        params: {
          resultJson: JSON.stringify(payload),
          person1Name,
          person2Name,
        },
      });
      return;
    }
    case 'monthly_horoscope':
      router.push({
        pathname: '/tools/monthly-horoscope',
        params: {
          resultJson: JSON.stringify(payload),
          savedUnlocked: '1',
        },
      });
      return;
    case 'free_kundli':
      router.push({
        pathname: '/tools/kundli-result',
        params: { resultJson: JSON.stringify(payload) },
      });
      return;
    case 'free_compatibility': {
      const record = asRecord(payload);
      router.push({
        pathname: '/tools/compatibility-result',
        params: {
          resultJson: JSON.stringify(payload),
          person1Name: str(record?.person1Name),
          person2Name: str(record?.person2Name),
        },
      });
      return;
    }
    case 'daily_horoscope':
      router.push({
        pathname: '/tools/horoscope-result',
        params: { resultJson: JSON.stringify(payload) },
      });
      return;
    case 'tarot':
      router.push({
        pathname: '/tools/tarot',
        params: { resultJson: JSON.stringify(payload) },
      });
      return;
    case 'palm_reading':
      router.push({
        pathname: '/tools/palm-reading',
        params: { resultJson: JSON.stringify(payload) },
      });
      return;
    default:
      return;
  }
}

export type MonthlyHoroscopeUnlockPayload = MonthlyHoroscopeResponse;
