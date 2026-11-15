import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type {
  BookingListItem,
  BookingUserDetails,
  CurrentUser,
  PanditMe,
  VerifyOtpResponse,
} from "../types";
import { getStoredToken, usePanditStore } from "../store/usePanditStore";

/** Routes that must stay reachable without a pandit session (consent, legal, login). */
const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/terms",
  "/privacy-policy",
  "/refund-policy",
  "/disclaimer",
  "/contact",
  "/account-deletion",
] as const;

export function isPublicAppPath(
  pathname: string = window.location.pathname,
): boolean {
  const path = pathname.split("?")[0] || "/";
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function redirectToLoginIfProtected(): void {
  if (isPublicAppPath()) return;
  window.location.href = "/login";
}

export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE;
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "http://localhost:3001";
  }
  throw new Error("VITE_API_BASE is not configured");
}

export const api = axios.create({
  baseURL: getApiBase(),
  withCredentials: true,
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshInFlight: Promise<string | null> | null = null;

export type TokenPairResponse = {
  accessToken: string;
  refreshToken: string;
  refreshMaxAgeSeconds?: number;
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = (async () => {
    try {
      const { data } = await api.post<TokenPairResponse>("/auth/refresh", {});
      if (typeof data?.accessToken !== "string" || !data.accessToken) {
        return null;
      }
      usePanditStore.getState().setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/** Hydrate access token from httpOnly refresh cookie (page load). */
export async function bootstrapAuthSession(): Promise<boolean> {
  const token = await refreshAccessToken();
  if (token) {
    try {
      await fetchCurrentUser();
    } catch {
      usePanditStore.getState().clearLocalAuth();
    }
  }
  usePanditStore.getState().markAuthHydrated();
  return Boolean(token);
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const { data } = await api.get<CurrentUser>("/auth/me");
  usePanditStore
    .getState()
    .setAuth(usePanditStore.getState().accessToken ?? "", data.id, data.role);
  if (data.panditId && data.name) {
    usePanditStore.getState().setPanditInfo(data.panditId, data.name, false);
  }
  return data;
}

export async function logoutSession(): Promise<void> {
  try {
    await api.post("/auth/logout", {});
  } catch {
    // Still clear local state.
  } finally {
    usePanditStore.getState().clearLocalAuth();
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (error.response?.status !== 401 || !original) {
      return Promise.reject(error);
    }

    const url = original.url ?? "";
    if (
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout") ||
      original._retry
    ) {
      usePanditStore.getState().clearLocalAuth();
      redirectToLoginIfProtected();
      return Promise.reject(error);
    }

    original._retry = true;
    const next = await refreshAccessToken();
    if (!next) {
      usePanditStore.getState().clearLocalAuth();
      redirectToLoginIfProtected();
      return Promise.reject(error);
    }
    original.headers.Authorization = `Bearer ${next}`;
    return api.request(original);
  },
);

export function buildIndiaPhone(digits10: string): string {
  const d = digits10.replace(/\D/g, "").slice(0, 10);
  return `+91${d}`;
}

export async function requestOtp(
  phoneNumber: string,
  intent?: "dashboard",
): Promise<void> {
  await api.post("/auth/request-otp", {
    phoneNumber,
    ...(intent ? { intent } : {}),
  });
}

export async function verifyOtp(
  phoneNumber: string,
  otp: string,
  acceptedLegalConsent: boolean,
  intent?: "dashboard",
): Promise<VerifyOtpResponse> {
  const { data } = await api.post<VerifyOtpResponse>("/auth/verify-otp", {
    phoneNumber,
    otp,
    acceptedLegalConsent,
    ...(intent ? { intent } : {}),
  });
  return data;
}

export async function fetchPanditMe(): Promise<PanditMe> {
  const { data } = await api.get<PanditMe>("/experts/me");
  return data;
}

export async function updatePresence(
  panditId: string,
  isOnline: boolean,
): Promise<{ id: string; isOnline: boolean }> {
  const { data } = await api.patch<{ id: string; isOnline: boolean }>(
    `/experts/${panditId}/presence`,
    { isOnline },
  );
  return data;
}

export async function fetchPanditBookings(): Promise<BookingListItem[]> {
  const { data } = await api.get<BookingListItem[]>("/bookings/pandit");
  return data;
}

export async function cancelBookingAsPandit(bookingId: string): Promise<void> {
  await api.post(`/bookings/${bookingId}/pandit-cancel`);
}

export async function getUserDetailsForBooking(
  bookingId: string,
): Promise<BookingUserDetails> {
  const { data } = await api.get<BookingUserDetails>(
    `/bookings/${bookingId}/user-details`,
  );
  return data;
}

export interface SharedBookingContext {
  id: string;
  text: string;
  version: number;
  sharedAt: string;
  contextVersion: number;
}

export async function getSharedContextForBooking(
  bookingId: string,
): Promise<SharedBookingContext[]> {
  const { data } = await api.get<SharedBookingContext[]>(
    `/bookings/${bookingId}/shared-context`,
  );
  return data;
}

export interface ChimeMeeting {
  MeetingId?: string;
  ExternalMeetingId?: string;
  MediaRegion?: string;
  MediaPlacement?: {
    AudioHostUrl?: string;
    AudioFallbackUrl?: string;
    SignalingUrl?: string;
    TurnControlUrl?: string;
  };
}

export interface ChimeAttendee {
  AttendeeId?: string;
  ExternalUserId?: string;
  JoinToken?: string;
}

export interface JoinAudioSessionResponse {
  meeting: ChimeMeeting;
  attendee: ChimeAttendee;
}

export async function joinAudioSession(
  bookingId: string,
): Promise<JoinAudioSessionResponse> {
  const { data } = await api.post<JoinAudioSessionResponse>(
    "/sessions/audio/join",
    { bookingId },
  );
  return data;
}

export async function endAudioSessionApi(bookingId: string): Promise<void> {
  await api.delete(`/sessions/audio/${bookingId}`);
}

export async function joinVideoSession(
  bookingId: string,
): Promise<JoinAudioSessionResponse> {
  const { data } = await api.post<JoinAudioSessionResponse>(
    "/sessions/video/join",
    { bookingId },
  );
  return data;
}

export async function endVideoSessionApi(bookingId: string): Promise<void> {
  await api.delete(`/sessions/video/${bookingId}`);
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message: unknown }).message;
      if (typeof message === "string") return message;
      if (Array.isArray(message)) return message.join(", ");
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
