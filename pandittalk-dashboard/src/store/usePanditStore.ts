import { create } from 'zustand';
import type { BookingListItem } from '../types';
import { useNotificationStore } from './useNotificationStore';

const USER_ID_KEY = 'pandit_user_id';
const PANDIT_ID_KEY = 'pandit_id';
const PANDIT_NAME_KEY = 'pandit_name';
const IS_ONLINE_KEY = 'pandit_is_online';

interface PanditState {
  accessToken: string | null;
  userId: string | null;
  panditId: string | null;
  panditName: string | null;
  isOnline: boolean;
  bookings: BookingListItem[];
  /** False until cookie refresh attempt finishes on boot. */
  authHydrated: boolean;
  setAuth: (token: string, userId: string) => void;
  setPanditInfo: (id: string, name: string, isOnline: boolean) => void;
  setOnline: (isOnline: boolean) => void;
  setBookings: (bookings: BookingListItem[]) => void;
  markAuthHydrated: () => void;
  clearLocalAuth: () => void;
  logout: () => void;
}

function readStoredBoolean(key: string): boolean {
  return localStorage.getItem(key) === 'true';
}

export const usePanditStore = create<PanditState>((set) => ({
  // Access JWT stays in memory only (not localStorage) — see docs/dashboard-auth.md
  accessToken: null,
  userId: localStorage.getItem(USER_ID_KEY),
  panditId: localStorage.getItem(PANDIT_ID_KEY),
  panditName: localStorage.getItem(PANDIT_NAME_KEY),
  isOnline: readStoredBoolean(IS_ONLINE_KEY),
  bookings: [],
  authHydrated: false,

  setAuth: (token, userId) => {
    localStorage.setItem(USER_ID_KEY, userId);
    set({ accessToken: token, userId, authHydrated: true });
  },

  setPanditInfo: (id, name, isOnline) => {
    localStorage.setItem(PANDIT_ID_KEY, id);
    localStorage.setItem(PANDIT_NAME_KEY, name);
    localStorage.setItem(IS_ONLINE_KEY, String(isOnline));
    set({ panditId: id, panditName: name, isOnline });
  },

  setOnline: (isOnline) => {
    localStorage.setItem(IS_ONLINE_KEY, String(isOnline));
    set({ isOnline });
  },

  setBookings: (bookings) => set({ bookings }),

  markAuthHydrated: () => set({ authHydrated: true }),

  clearLocalAuth: () => {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(PANDIT_ID_KEY);
    localStorage.removeItem(PANDIT_NAME_KEY);
    localStorage.removeItem(IS_ONLINE_KEY);
    // Migrate away from legacy JWT key if present
    localStorage.removeItem('pandit_access_token');
    useNotificationStore.getState().reset();
    set({
      accessToken: null,
      userId: null,
      panditId: null,
      panditName: null,
      isOnline: false,
      bookings: [],
      authHydrated: true,
    });
  },

  logout: () => {
    usePanditStore.getState().clearLocalAuth();
  },
}));

export function getStoredToken(): string | null {
  return usePanditStore.getState().accessToken;
}
