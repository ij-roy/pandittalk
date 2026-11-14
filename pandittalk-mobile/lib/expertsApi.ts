import axios from 'axios';

import { API_BASE } from '@/lib/authApi';

/** Normalized expert — aligned with typical Prisma fields + UI fallbacks. */
export type ExpertEntity = {
  id: string;
  name: string;
  specialty: string;
  languagesDisplay: string;
  languages: string[];
  experienceYears: number;
  experienceLabel: string;
  rating: number;
  ratingDisplay: number;
  totalReviews: number;
  reviewCountLabel: string;
  bio: string;
  imageUrl: string | null;
  verified: boolean;
  isOnline: boolean;
  isPremium: boolean;
  category: string | null;
  /** Checkout chat price in rupees, same number the API sends as price_per_session. */
  pricePerSession: number;
};

function numOrNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function str(v: unknown, fallback: string): string {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return fallback;
}

function formatReviewCount(n: number): string {
  try {
    return new Intl.NumberFormat('en-IN').format(n);
  } catch {
    return String(n);
  }
}

function languagesList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

function languagesToDisplay(raw: unknown): string {
  const parts = languagesList(raw);
  if (parts.length) return parts.join(', ');
  return 'English, Hindi';
}

function experienceYears(raw: Record<string, unknown>): number {
  const y =
    numOrNull(raw.experience) ??
    numOrNull(raw.experienceYears) ??
    numOrNull(raw.experience_years) ??
    numOrNull(raw.yearsOfExperience);
  if (y != null && y > 0) return Math.round(y);
  const label = str(raw.experience_label, '');
  const m = label.match(/(\d+)\s*\+?\s*(yr|year)/i);
  if (m) return parseInt(m[1], 10);
  return 0;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function parseBooleanField(v: unknown): boolean | undefined {
  if (v === true || v === 1 || v === 'true' || v === '1') return true;
  if (v === false || v === 0 || v === 'false' || v === '0') return false;
  return undefined;
}

/** Presence / availability from API; defaults to false when absent. */
function parseIsOnline(o: Record<string, unknown>): boolean {
  return (
    parseBooleanField(o.isOnline) ??
    parseBooleanField(o.is_online) ??
    parseBooleanField(o.online) ??
    false
  );
}

/** Display name from raw expert/pandit JSON (nested or flat). */
export function resolveExpertDisplayName(raw: unknown): string | null {
  const root = asRecord(raw);
  const inner = root?.data ?? root?.expert ?? raw;
  const o = asRecord(inner);
  if (!o) return null;

  const name = str(o.name, '') || str(o.pandit_name, '');
  if (name) return name;

  const first = str(o.first_name ?? o.firstName, '');
  const last = str(o.last_name ?? o.lastName, '');
  const full = [first, last].filter(Boolean).join(' ').trim();
  return full || null;
}

export function normalizeExpertPayload(raw: unknown): ExpertEntity | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = str(o.id, '');
  if (!id) return null;

  const name = str(o.name, 'Pandit');
  const specialty = str(o.specialty, str(o.specialization, 'Astrology & guidance'));
  const languages = languagesList(o.languages ?? o.languages_spoken);
  const languagesDisplay = languagesToDisplay(o.languages ?? o.languages_spoken);
  const expYears = experienceYears(o);
  const experienceLabel =
    str(o.experience_label, '') ||
    (expYears > 0 ? `${expYears} Years Experience` : 'Experience not listed');

  const ratingRaw =
    numOrNull(o.rating) ?? numOrNull(o.avg_rating) ?? numOrNull(o.average_rating) ?? 0;
  const ratingValue = Math.min(5, Math.max(0, ratingRaw));
  const rating = Math.round(ratingValue);

  const totalReviews =
    numOrNull(o.total_reviews) ??
    numOrNull(o.totalReviews) ??
    numOrNull(o.review_count) ??
    0;
  const tr = Math.max(0, Math.round(totalReviews ?? 0));
  // Never invent "0 Reviews" social proof — empty means no verified public reviews yet.
  const reviewCountLabel =
    tr > 0 ? `${formatReviewCount(tr)} Reviews` : 'No public reviews yet';

  const bio = str(o.bio, str(o.about, str(o.description, ''))) || 'Guidance tailored to you.';

  const imageUrl =
    typeof o.image_url === 'string'
      ? o.image_url
      : typeof o.imageUrl === 'string'
        ? o.imageUrl
        : typeof o.photo_url === 'string'
          ? o.photo_url
          : null;

  const verified = Boolean(o.verified ?? o.is_verified ?? o.isVerified);
  const isOnline = parseIsOnline(o);
  const isPremium = Boolean(o.is_premium ?? o.isPremium ?? o.premium);
  const category =
    typeof o.category === 'string'
      ? o.category
      : typeof o.category_slug === 'string'
        ? o.category_slug
        : typeof o.category_name === 'string'
          ? o.category_name
          : typeof o.primary_category === 'string'
            ? o.primary_category
            : null;
  const pricePerSession = Math.max(
    0,
    Math.round(
      numOrNull(o.price_per_session) ??
        numOrNull(o.pricePerSession) ??
        numOrNull(o.price) ??
        0,
    ),
  );

  return {
    id,
    name,
    specialty,
    languagesDisplay,
    languages,
    experienceYears: expYears,
    experienceLabel,
    rating,
    ratingDisplay: Math.round(ratingValue * 10) / 10,
    totalReviews: tr,
    reviewCountLabel,
    bio,
    imageUrl,
    verified,
    isOnline,
    isPremium,
    category,
    pricePerSession,
  };
}

function unwrapArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const o = asRecord(payload);
  if (!o) return [];
  if (Array.isArray(o.data)) return o.data;
  if (Array.isArray(o.experts)) return o.experts;
  if (Array.isArray(o.items)) return o.items;
  return [];
}

export type FetchExpertsParams = {
  search?: string;
  area?: string;
};

export async function fetchExperts(params: FetchExpertsParams = {}): Promise<ExpertEntity[]> {
  const query: Record<string, string> = {};
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.area?.trim()) query.area = params.area.trim();

  const res = await axios.get(`${API_BASE}/experts`, {
    params: Object.keys(query).length > 0 ? query : undefined,
  });
  const rows = unwrapArray(res.data);
  const list = rows.map(normalizeExpertPayload).filter(Boolean) as ExpertEntity[];
  return list;
}

export async function fetchExpertById(id: string): Promise<ExpertEntity | null> {
  const res = await axios.get(`${API_BASE}/experts/${encodeURIComponent(id)}`);
  const body = res.data;
  const inner = asRecord(body)?.data ?? asRecord(body)?.expert ?? body;
  return normalizeExpertPayload(inner);
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchFollowedExperts(accessToken: string): Promise<ExpertEntity[]> {
  const res = await axios.get(`${API_BASE}/experts/following`, {
    headers: authHeaders(accessToken),
  });
  return unwrapArray(res.data).map(normalizeExpertPayload).filter(Boolean) as ExpertEntity[];
}

export async function fetchFollowStatus(accessToken: string, panditId: string): Promise<boolean> {
  const res = await axios.get(`${API_BASE}/experts/${encodeURIComponent(panditId)}/follow`, {
    headers: authHeaders(accessToken),
  });
  return Boolean(asRecord(res.data)?.following);
}

export async function setPanditFollowed(
  accessToken: string,
  panditId: string,
  following: boolean,
): Promise<boolean> {
  const url = `${API_BASE}/experts/${encodeURIComponent(panditId)}/follow`;
  const headers = authHeaders(accessToken);
  const res = following
    ? await axios.put(url, {}, { headers })
    : await axios.delete(url, { headers });
  return Boolean(asRecord(res.data)?.following);
}
