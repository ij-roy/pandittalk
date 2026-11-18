import axios from 'axios';

import { CLIENT_PLATFORM_HEADER, clientPlatformValue } from '@/lib/iosStorePolicy';
import { connectionFailureCopy } from '@/lib/connectionErrorCopy';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { useAuthStore } from '@/store/useAuthStore';

/** ngrok free tier returns 401 without this header (shows as "Unauthorized" in the app). */
export function isNgrokApiBase(base: string): boolean {
  return /ngrok-free\.dev|ngrok\.io|ngrok\.app/i.test(base);
}

function resolveDebuggerHost(): string | null {
  const candidates = [
    Constants.expoGoConfig?.debuggerHost,
    Constants.expoConfig?.hostUri,
  ];

  for (const raw of candidates) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const host = raw.split(':')[0]?.trim();
    if (host) return host;
  }

  return null;
}

/**
 * API origin for NestJS. Override on a physical device with Expo env, e.g. in `.env`:
 * `EXPO_PUBLIC_API_BASE=http://192.168.1.10:3001`
 * — In dev, Expo's debugger host is used automatically on physical devices.
 * — Android emulator uses `10.0.2.2`; iOS simulator uses localhost.
 * — Release builds default to the public PanditTalk API when unset.
 */
export function getApiBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }

  if (__DEV__) {
    const debuggerHost = resolveDebuggerHost();
    if (debuggerHost) {
      return `http://${debuggerHost}:3001`;
    }
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3001';
    }
    return 'http://localhost:3001';
  }

  return 'https://api-pandittalk.dophera.tech';
}

export const API_BASE = getApiBase();
const AUTH_BASE = API_BASE;

if (__DEV__) {
  console.log('[authApi] API_BASE =', API_BASE);
}

axios.interceptors.request.use((config) => {
  config.headers.set(CLIENT_PLATFORM_HEADER, clientPlatformValue());
  if (isNgrokApiBase(API_BASE)) {
    config.headers.set('ngrok-skip-browser-warning', 'true');
  }
  return config;
});


let handling401 = false;
let refreshInFlight: Promise<string | null> | null = null;

export type TokenPairResponse = {
  accessToken: string;
  refreshToken: string;
  refreshMaxAgeSeconds?: number;
};

/** Successful `POST /auth/verify-otp` response (JWT session). */
export type VerifyOtpResponse = TokenPairResponse & {
  hasProfile: boolean;
  isNewUser?: boolean;
  coinBalance?: number;
  user?: Array<{ coinBalance?: number }>;
};

export type SocialPendingResponse = {
  needsPhone: true;
  pendingToken: string;
};

export function isSocialPending(
  data: unknown,
): data is SocialPendingResponse {
  if (!data || typeof data !== 'object') return false;
  const rec = data as Record<string, unknown>;
  return rec.needsPhone === true && typeof rec.pendingToken === 'string';
}

export function applyAuthSession(data: VerifyOtpResponse): void {
  const accessToken = data.accessToken;
  const refreshToken = data.refreshToken;
  const hasProfile = data.hasProfile;
  const coinBalance =
    typeof data.coinBalance === 'number' && Number.isFinite(data.coinBalance)
      ? data.coinBalance
      : typeof data.user?.[0]?.coinBalance === 'number'
        ? data.user[0].coinBalance
        : undefined;
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new Error('No access token received. Check your API response.');
  }
  if (typeof refreshToken !== 'string' || !refreshToken) {
    throw new Error('No refresh token received. Check your API response.');
  }
  if (typeof hasProfile !== 'boolean') {
    throw new Error('Invalid auth response. Check your API response.');
  }
  useAuthStore.getState().setAuth({ accessToken, refreshToken, hasProfile, coinBalance });
}

async function persistRefreshedTokens(pair: TokenPairResponse): Promise<void> {
  const { hasProfile } = useAuthStore.getState();
  useAuthStore.getState().setAuth({
    accessToken: pair.accessToken,
    refreshToken: pair.refreshToken,
    hasProfile,
  });
  try {
    const { chatSocket } = await import('./chatSocket');
    chatSocket.updateAccessToken?.(pair.accessToken);
  } catch {
    // Socket module may not be loaded yet.
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      return null;
    }
    try {
      const { data } = await axios.post<TokenPairResponse>(
        `${AUTH_BASE}/auth/refresh`,
        { refreshToken },
      );
      if (
        typeof data?.accessToken !== 'string' ||
        typeof data?.refreshToken !== 'string'
      ) {
        return null;
      }
      await persistRefreshedTokens(data);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function logoutSession(): Promise<void> {
  const refreshToken = useAuthStore.getState().refreshToken;
  try {
    if (refreshToken) {
      await axios.post(`${AUTH_BASE}/auth/logout`, { refreshToken });
    }
  } catch {
    // Local clear still proceeds.
  } finally {
    useAuthStore.getState().clearAuth();
  }
}

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      axios.isAxiosError(error) &&
      !error.response &&
      error.code !== 'ERR_CANCELED'
    ) {
      error.message = connectionFailureCopy(API_BASE);
    }
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const original = error.config;
    if (!original) {
      return Promise.reject(error);
    }

    const url = original.url ?? '';
    if (url.includes('/auth/refresh') || url.includes('/auth/logout')) {
      return Promise.reject(error);
    }

    const headers = original.headers;
    const authHeader =
      (typeof headers?.Authorization === 'string' && headers.Authorization) ||
      (typeof headers?.authorization === 'string' && headers.authorization) ||
      '';

    if (!authHeader.startsWith('Bearer ') || handling401) {
      return Promise.reject(error);
    }

    handling401 = true;
    try {
      const nextAccess = await refreshAccessToken();
      if (!nextAccess) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${nextAccess}`;
      return axios.request(original);
    } finally {
      handling401 = false;
    }
  },
);

/** Body for `PATCH /users/profile` — matches backend `UpdateProfileDto` and UI fields. */
export type UpdateProfileDto = {
  firstName?: string;
  lastName?: string;
  gender?: string;
  dob?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  maritalStatus?: string;
  currentAddress?: string;
  city?: string;
  postalCode?: string;
  profileImageUrl?: string;
};

/** Typical `GET /users/profile` shape; backend may nest under `user` / `data` (handled in UI). */
export type UserProfile = Partial<UpdateProfileDto> & {
  phoneNumber?: string;
  email?: string;
  googleLinked?: boolean;
  coinBalance?: number;
  profileProgress?: import('./profileProgress').ProfileProgress;
};

export function buildIndiaPhone(digits10: string): string {
  const d = digits10.replace(/\D/g, '').slice(0, 10);
  return `+91${d}`;
}

/** Seconds until OTP request/verify is allowed again (429 + Retry-After). */
export function parseOtpRetryAfterSeconds(err: unknown): number | null {
  if (!axios.isAxiosError(err) || err.response?.status !== 429) return null;
  const data = err.response.data as
    | { retryAfterSeconds?: unknown; message?: unknown }
    | undefined;
  const fromBody =
    typeof data?.retryAfterSeconds === 'number'
      ? data.retryAfterSeconds
      : typeof data?.retryAfterSeconds === 'string'
        ? Number(data.retryAfterSeconds)
        : NaN;
  if (Number.isFinite(fromBody) && fromBody > 0) {
    return Math.ceil(fromBody);
  }
  const header = err.response.headers?.['retry-after'] ?? err.response.headers?.['Retry-After'];
  const fromHeader = typeof header === 'string' || typeof header === 'number' ? Number(header) : NaN;
  if (Number.isFinite(fromHeader) && fromHeader > 0) {
    return Math.ceil(fromHeader);
  }
  return 60;
}

export function formatOtpRateLimitMessage(retryAfterSeconds: number): string {
  const s = Math.max(1, Math.ceil(retryAfterSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  const wait = m > 0 ? `${m}:${r.toString().padStart(2, '0')}` : `${r}s`;
  return `Too many codes sent. Please wait ${wait} before trying again.`;
}

export function formatApiConnectionError(err: unknown, apiBase: string = API_BASE): string {
  const retryAfter = parseOtpRetryAfterSeconds(err);
  if (retryAfter != null) {
    return formatOtpRateLimitMessage(retryAfter);
  }
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: unknown; error?: unknown } | undefined;
    if (typeof data?.message === 'string' && data.message.trim()) return data.message;
    if (Array.isArray(data?.message)) {
      const joined = data.message.map(String).filter(Boolean).join(', ');
      if (joined) return joined;
    }
    if (typeof data?.error === 'string' && data.error.trim()) return data.error;

    const code = err.code ?? '';
    const msg = err.message ?? '';
    const isNetworkFailure =
      code === 'ECONNABORTED' ||
      code === 'ERR_NETWORK' ||
      /network error|timeout/i.test(msg);

    if (isNetworkFailure || !err.response) {
      return connectionFailureCopy(apiBase);
    }

    if (msg) return msg;
  }
  if (err instanceof Error) return err.message;
  // Non-Error Google / native objects with a code (login path)
  const code = (err as { code?: string } | null)?.code;
  if (typeof code === 'string' && code) {
    if (code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      return 'Google Play Services is missing or needs an update. Use mobile OTP instead.';
    }
    if (code === 'INTERNAL_ERROR' || code === 'DEVELOPER_ERROR') {
      return 'Google Sign-In is unavailable on this install. Use mobile number and OTP instead.';
    }
    if (code === 'NETWORK_ERROR') {
      return 'Network error during Google Sign-In. Check your connection and try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}

export async function postRequestOtp(phoneE164: string) {
  return axios.post(`${AUTH_BASE}/auth/request-otp`, {
    phoneNumber: phoneE164,
  });
}

export async function verifyOtp(
  phoneE164: string,
  otp: string,
  acceptedLegalConsent: boolean,
) {
  return axios.post<VerifyOtpResponse>(`${AUTH_BASE}/auth/verify-otp`, {
    phoneNumber: phoneE164,
    otp,
    acceptedLegalConsent,
  });
}

export async function postGoogleAuth(
  idToken: string,
  acceptedLegalConsent: boolean,
) {
  return axios.post<VerifyOtpResponse | SocialPendingResponse>(`${AUTH_BASE}/auth/google`, {
    idToken,
    acceptedLegalConsent,
  });
}

export async function postAppleAuth(
  identityToken: string,
  acceptedLegalConsent: boolean,
  firstName?: string | null,
  lastName?: string | null,
) {
  return axios.post<VerifyOtpResponse | SocialPendingResponse>(`${AUTH_BASE}/auth/apple`, {
    identityToken,
    acceptedLegalConsent,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
  });
}

export async function completeSocialAuth(
  pendingToken: string,
  phoneE164: string,
  otp: string,
) {
  return axios.post<VerifyOtpResponse>(`${AUTH_BASE}/auth/complete-social`, {
    pendingToken,
    phoneNumber: phoneE164,
    otp,
  });
}

export async function linkGoogleAccount(accessToken: string, idToken: string) {
  return axios.post<VerifyOtpResponse>(
    `${AUTH_BASE}/auth/link-google`,
    { idToken },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export async function patchUserProfile(accessToken: string, body: UpdateProfileDto) {
  return axios.patch(`${AUTH_BASE}/users/profile`, body, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function getUserProfile(accessToken: string) {
  return axios.get<UserProfile>(`${AUTH_BASE}/users/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function deleteUserProfile(accessToken: string) {
  return axios.delete<{ success: boolean }>(`${AUTH_BASE}/users/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/** Resolve relative avatar paths from the API to a full fetchable URL. */
export function resolveMediaUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = API_BASE.replace(/\/$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

export async function uploadProfileAvatar(
  accessToken: string,
  fileUri: string,
  mimeType = 'image/jpeg',
) {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: 'avatar.jpg',
    type: mimeType,
  } as unknown as Blob);
  return axios.post<{ profileImageUrl: string }>(
    `${AUTH_BASE}/users/profile/avatar`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}
