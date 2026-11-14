import { create } from 'zustand';

import { clearAuthSession, saveAuthSession } from '../lib/authSecureStorage';

export type SetAuthPayload = {
  accessToken: string;
  refreshToken: string;
  hasProfile: boolean;
  coinBalance?: number;
};

/** Profile/user payload from the API; narrow or replace when the backend contract is fixed. */
export type AuthUser = Record<string, unknown>;

function parseCoinBalance(source: unknown): number | undefined {
  if (!source || typeof source !== 'object') return undefined;
  const o = source as Record<string, unknown>;
  const raw = o.coinBalance ?? o.coin_balance;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  hasProfile: boolean;
  user: AuthUser | null;
  walletBalance: number;
  /** True after persisted session has been read (or user signed in). */
  authHydrated: boolean;
  /** In-memory only (resets each cold start) so launch stays login-first. */
  guestMode: boolean;
  setAuth: (payload: SetAuthPayload) => void;
  setUser: (userData: AuthUser) => void;
  updateProfileImageUrl: (profileImageUrl: string) => void;
  setWalletBalance: (balance: number) => void;
  setHasProfile: (hasProfile: boolean) => void;
  markAuthHydrated: () => void;
  /** Tokens from disk before refresh finishes. Keeps the splash up so login does not flash. */
  stageRestoredSession: (payload: SetAuthPayload) => void;
  continueAsGuest: () => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  hasProfile: false,
  user: null,
  walletBalance: 0,
  authHydrated: false,
  guestMode: false,
  setAuth: ({ accessToken, refreshToken, hasProfile, coinBalance }) => {
    void saveAuthSession({ accessToken, refreshToken, hasProfile });
    set((state) => ({
      accessToken,
      refreshToken,
      hasProfile,
      authHydrated: true,
      guestMode: false,
      walletBalance: coinBalance ?? state.walletBalance,
    }));
  },
  setUser: (userData) =>
    set((state) => {
      const coinBalance = parseCoinBalance(userData);
      return {
        user: userData,
        ...(coinBalance !== undefined ? { walletBalance: coinBalance } : {}),
      };
    }),
  updateProfileImageUrl: (profileImageUrl) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, profileImageUrl }
        : { profileImageUrl },
    })),
  setWalletBalance: (balance) => set({ walletBalance: balance }),
  setHasProfile: (hasProfile) => {
    set({ hasProfile });
    const { accessToken, refreshToken } = get();
    if (accessToken && refreshToken) {
      void saveAuthSession({ accessToken, refreshToken, hasProfile });
    }
  },
  markAuthHydrated: () => set({ authHydrated: true }),
  stageRestoredSession: ({ accessToken, refreshToken, hasProfile, coinBalance }) =>
    set((state) => ({
      accessToken,
      refreshToken,
      hasProfile,
      guestMode: false,
      walletBalance: coinBalance ?? state.walletBalance,
    })),
  continueAsGuest: () => set({ guestMode: true }),
  clearAuth: () => {
    void clearAuthSession();
    set({
      accessToken: null,
      refreshToken: null,
      hasProfile: false,
      user: null,
      walletBalance: 0,
      authHydrated: true,
      guestMode: false,
    });
  },
}));
