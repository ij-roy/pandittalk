import axios from 'axios';

import { API_BASE, getUserProfile } from '@/lib/authApi';
import { getWallet } from '@/lib/walletApi';
import { useAuthStore } from '@/store/useAuthStore';

export type KundliPlanet = {
  name: string;
  sign: string;
  house: number;
  degree: number | string;
};

export type KundliResponse = {
  chart: unknown;
  planets: KundliPlanet[];
  firstName: string;
  lastName: string;
};

export type KundliRequest = {
  firstName: string;
  lastName: string;
  dob: string;
  timeOfBirth: string;
  placeOfBirth: string;
  coordinates?: string;
};

export async function postKundli(
  body: KundliRequest,
  signal?: AbortSignal,
): Promise<KundliResponse> {
  const { data } = await axios.post<KundliResponse>(`${API_BASE}/tools/kundli`, body, {
    signal,
    ...optionalAuthConfig(),
  });
  return data;
}

export type KundliDosha = {
  name: string;
  present: boolean;
  severity?: string;
  description: string;
};

export type KundliDasha = {
  mahadasha: string;
  antardasha: string;
  endsOn: string;
  meaning: string;
};

export type KundliLuckyElements = {
  number: string | number;
  color: string;
  day: string;
  gemstone: string;
  deity: string;
};

export type KundliRemedy = {
  title: string;
  description: string;
};

export type DetailedKundliResponse = KundliResponse & {
  lifeNarrative: string;
  doshas: KundliDosha[];
  dasha: KundliDasha;
  luckyElements: KundliLuckyElements;
  remedies: KundliRemedy[];
  newBalance?: number;
};

export type DetailedKundliRequest = KundliRequest & { detailed: true };

function normalizeDosha(value: unknown): KundliDosha | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.name !== 'string') return null;
  return {
    name: obj.name,
    present: Boolean(obj.present),
    severity: typeof obj.severity === 'string' ? obj.severity : undefined,
    description: typeof obj.description === 'string' ? obj.description : '',
  };
}

function normalizeDasha(value: unknown): KundliDasha {
  if (!value || typeof value !== 'object') {
    return { mahadasha: '', antardasha: '', endsOn: '', meaning: '' };
  }
  const obj = value as Record<string, unknown>;
  return {
    mahadasha: typeof obj.mahadasha === 'string' ? obj.mahadasha : '',
    antardasha: typeof obj.antardasha === 'string' ? obj.antardasha : '',
    endsOn:
      typeof obj.endsOn === 'string'
        ? obj.endsOn
        : typeof obj.endDate === 'string'
          ? obj.endDate
          : '',
    meaning: typeof obj.meaning === 'string' ? obj.meaning : '',
  };
}

function normalizeLuckyElements(value: unknown): KundliLuckyElements {
  if (!value || typeof value !== 'object') {
    return { number: '', color: '', day: '', gemstone: '', deity: '' };
  }
  const obj = value as Record<string, unknown>;
  const number = obj.number ?? obj.luckyNumber;
  return {
    number: typeof number === 'string' || typeof number === 'number' ? number : '',
    color: typeof obj.color === 'string' ? obj.color : '',
    day: typeof obj.day === 'string' ? obj.day : '',
    gemstone: typeof obj.gemstone === 'string' ? obj.gemstone : '',
    deity: typeof obj.deity === 'string' ? obj.deity : '',
  };
}

function normalizeRemedy(value: unknown): KundliRemedy | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.title !== 'string') return null;
  return {
    title: obj.title,
    description: typeof obj.description === 'string' ? obj.description : '',
  };
}

export function normalizeDetailedKundliResponse(raw: unknown): DetailedKundliResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.planets)) return null;

  const doshaSource = obj.doshas ?? obj.doshaAnalysis;
  const doshas = Array.isArray(doshaSource)
    ? doshaSource.map(normalizeDosha).filter((d): d is KundliDosha => d !== null)
    : [];

  const remediesSource = obj.remedies;
  const remedies = Array.isArray(remediesSource)
    ? remediesSource.map(normalizeRemedy).filter((r): r is KundliRemedy => r !== null)
    : [];

  return {
    chart: obj.chart,
    planets: obj.planets as KundliPlanet[],
    firstName: typeof obj.firstName === 'string' ? obj.firstName : '',
    lastName: typeof obj.lastName === 'string' ? obj.lastName : '',
    lifeNarrative: typeof obj.lifeNarrative === 'string' ? obj.lifeNarrative : '',
    doshas,
    dasha: normalizeDasha(obj.dasha ?? obj.currentDasha),
    luckyElements: normalizeLuckyElements(obj.luckyElements),
    remedies,
    newBalance:
      typeof obj.newBalance === 'number'
        ? obj.newBalance
        : typeof obj.newBalance === 'string'
          ? Number(obj.newBalance)
          : undefined,
  };
}

export async function postDetailedKundli(
  body: DetailedKundliRequest,
  accessToken: string,
  signal?: AbortSignal,
): Promise<DetailedKundliResponse> {
  try {
    const { data } = await axios.post<unknown>(`${API_BASE}/tools/kundli`, body, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    });
    const normalized = normalizeDetailedKundliResponse(data);
    if (!normalized) {
      throw new Error('Invalid detailed kundli response from server.');
    }
    if (typeof normalized.newBalance === 'number' && !Number.isNaN(normalized.newBalance)) {
      useAuthStore.getState().setWalletBalance(normalized.newBalance);
    }
    return normalized;
  } catch (err) {
    await refreshWalletBalanceFromProfile(accessToken).catch(() => undefined);
    throw err;
  }
}

export type HoroscopeRequest = { sign: string; type: 'daily' };

export type HoroscopeResponse = {
  sign: string;
  type: string;
  todayInsight: string;
  luckyColor: string;
  luckyTime: string;
  luckyNumber: string | number;
  prediction?: unknown;
};

export async function postHoroscope(body: HoroscopeRequest): Promise<HoroscopeResponse> {
  const { data } = await axios.post<HoroscopeResponse>(
    `${API_BASE}/tools/horoscope`,
    body,
    optionalAuthConfig(),
  );
  return data;
}

export type CompatibilityPerson = {
  name: string;
  dob: string;
  timeOfBirth: string;
  placeOfBirth: string;
  coordinates?: string;
};

export type CompatibilityRequest = {
  person1: CompatibilityPerson;
  person2: CompatibilityPerson;
};

export type CompatibilityResponse = {
  score: number;
  emotionalCompatibility: string;
  communication: string;
  longTermHarmony: string;
};

export async function postCompatibility(body: CompatibilityRequest): Promise<CompatibilityResponse> {
  const { data } = await axios.post<CompatibilityResponse>(
    `${API_BASE}/tools/compatibility`,
    body,
    optionalAuthConfig(),
  );
  return data;
}

export type CompatibilityRemedy = {
  title: string;
  description: string;
};

export type CompatibilityDoshaItem = {
  name: string;
  present: boolean;
  severity?: string;
  description: string;
};

export type DetailedCompatibilityResponse = CompatibilityResponse & {
  detailed: true;
  gunaMilan: string;
  doshaCompatibility: CompatibilityDoshaItem[];
  strengths: string;
  challenges: string;
  remedies: CompatibilityRemedy[];
  marriageOutlook: string;
  coupleNarrative: string;
  newBalance?: number;
};

export type DetailedCompatibilityRequest = CompatibilityRequest & { detailed: true };

function normalizeCompatibilityRemedy(value: unknown): CompatibilityRemedy | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.title !== 'string') return null;
  return {
    title: obj.title,
    description: typeof obj.description === 'string' ? obj.description : '',
  };
}

function normalizeCompatibilityDosha(value: unknown): CompatibilityDoshaItem | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.name !== 'string') return null;
  return {
    name: obj.name,
    present: Boolean(obj.present),
    severity: typeof obj.severity === 'string' ? obj.severity : undefined,
    description: typeof obj.description === 'string' ? obj.description : '',
  };
}

export function normalizeDetailedCompatibilityResponse(
  raw: unknown,
): DetailedCompatibilityResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (
    typeof obj.score !== 'number' ||
    typeof obj.emotionalCompatibility !== 'string' ||
    typeof obj.communication !== 'string' ||
    typeof obj.longTermHarmony !== 'string'
  ) {
    return null;
  }

  const remediesSource = obj.remedies;
  const remedies = Array.isArray(remediesSource)
    ? remediesSource.map(normalizeCompatibilityRemedy).filter((r): r is CompatibilityRemedy => r !== null)
    : [];

  const doshaSource = obj.doshaCompatibility;
  const doshaCompatibility = Array.isArray(doshaSource)
    ? doshaSource.map(normalizeCompatibilityDosha).filter((d): d is CompatibilityDoshaItem => d !== null)
    : [];

  return {
    score: obj.score,
    emotionalCompatibility: obj.emotionalCompatibility,
    communication: obj.communication,
    longTermHarmony: obj.longTermHarmony,
    detailed: true,
    gunaMilan: typeof obj.gunaMilan === 'string' ? obj.gunaMilan : '',
    doshaCompatibility,
    strengths: typeof obj.strengths === 'string' ? obj.strengths : '',
    challenges: typeof obj.challenges === 'string' ? obj.challenges : '',
    remedies,
    marriageOutlook: typeof obj.marriageOutlook === 'string' ? obj.marriageOutlook : '',
    coupleNarrative: typeof obj.coupleNarrative === 'string' ? obj.coupleNarrative : '',
    newBalance:
      typeof obj.newBalance === 'number'
        ? obj.newBalance
        : typeof obj.newBalance === 'string'
          ? Number(obj.newBalance)
          : undefined,
  };
}

export async function postDetailedCompatibility(
  body: DetailedCompatibilityRequest,
  accessToken: string,
): Promise<DetailedCompatibilityResponse> {
  try {
    const { data } = await axios.post<unknown>(`${API_BASE}/tools/compatibility`, body, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const normalized = normalizeDetailedCompatibilityResponse(data);
    if (!normalized) {
      throw new Error('Invalid detailed compatibility response from server.');
    }
    if (typeof normalized.newBalance === 'number' && !Number.isNaN(normalized.newBalance)) {
      useAuthStore.getState().setWalletBalance(normalized.newBalance);
    }
    const wallet = await getWallet(accessToken);
    useAuthStore.getState().setWalletBalance(wallet.coinBalance);
    return normalized;
  } catch (err) {
    await refreshWalletBalanceFromProfile(accessToken).catch(() => undefined);
    throw err;
  }
}

export type PalmReadingRequest = {
  leftPalmImage: string;
  rightPalmImage: string;
};

export type PalmLineInsight = {
  title: string;
  description: string;
};

export type PalmReadingResponse = {
  lifeLine: PalmLineInsight;
  heartLine: PalmLineInsight;
  headLine: PalmLineInsight;
};

function normalizePalmLine(value: unknown, fallbackTitle: string): PalmLineInsight {
  if (typeof value === 'string') {
    return { title: fallbackTitle, description: value };
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return {
      title: typeof obj.title === 'string' ? obj.title : fallbackTitle,
      description: typeof obj.description === 'string' ? obj.description : '',
    };
  }
  return { title: fallbackTitle, description: '' };
}

export async function postPalmReading(body: PalmReadingRequest): Promise<PalmReadingResponse> {
  const { data } = await axios.post<Record<string, unknown>>(
    `${API_BASE}/tools/palm-reading`,
    body,
    optionalAuthConfig(),
  );
  return {
    lifeLine: normalizePalmLine(data.lifeLine, 'Life Line'),
    heartLine: normalizePalmLine(data.heartLine, 'Heart Line'),
    headLine: normalizePalmLine(data.headLine, 'Head Line'),
  };
}

export type TarotResponse = {
  cardName: string;
  cardMeaning: string;
  yourInsight: string;
};

export async function postTarot(): Promise<TarotResponse> {
  const { data } = await axios.post<TarotResponse>(`${API_BASE}/tools/tarot`, {}, optionalAuthConfig());
  return data;
}

export type MonthlyHoroscopeRequest = { sign: string };

export type MonthlyHoroscopeResponse = {
  sign: string;
  monthlyOverview: string;
  career: string;
  relationships: string;
  health: string;
  keyOpportunities: string;
};

export async function postMonthlyHoroscope(
  body: MonthlyHoroscopeRequest,
): Promise<MonthlyHoroscopeResponse> {
  const { data } = await axios.post<MonthlyHoroscopeResponse>(
    `${API_BASE}/tools/monthly-horoscope`,
    body,
  );
  return data;
}

export type UnlockToolType =
  | 'monthly_horoscope'
  | 'detailed_kundli'
  | 'detailed_compatibility';

function optionalAuthConfig(): { headers?: { Authorization: string } } {
  const token = useAuthStore.getState().accessToken;
  if (!token) return {};
  return { headers: { Authorization: `Bearer ${token}` } };
}

export type UnlockToolResponse = {
  success: true;
  newBalance: number;
  toolType: UnlockToolType;
};

export async function refreshWalletBalanceFromProfile(
  accessToken: string,
): Promise<number> {
  const profileResponse = await getUserProfile(accessToken);
  const data = profileResponse.data as Record<string, unknown>;
  const freshBalance =
    data.coinBalance ?? data.walletBalance ?? data.coin_balance ?? 0;
  const balance = Number(freshBalance);
  useAuthStore.getState().setWalletBalance(balance);
  return balance;
}

export async function postUnlockTool(
  toolType: UnlockToolType,
  accessToken: string,
  reportPayload?: MonthlyHoroscopeResponse,
): Promise<UnlockToolResponse> {
  const { data } = await axios.post<UnlockToolResponse>(
    `${API_BASE}/tools/unlock`,
    { toolType, ...(reportPayload ? { reportPayload } : {}) },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  await refreshWalletBalanceFromProfile(accessToken);
  return data;
}

export async function unlockTool(
  toolType: string,
  accessToken: string,
  reportPayload?: MonthlyHoroscopeResponse,
) {
  try {
    const response = await axios.post(
      `${API_BASE}/tools/unlock`,
      { toolType, ...(reportPayload ? { reportPayload } : {}) },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    await refreshWalletBalanceFromProfile(accessToken);
    return response.data;
  } catch (err) {
    await refreshWalletBalanceFromProfile(accessToken).catch(() => undefined);
    throw err;
  }
}

export async function getUnlockedTools(accessToken: string): Promise<string[]> {
  const response = await axios.get(`${API_BASE}/tools/unlocked`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data.unlockedTools ?? [];
}
