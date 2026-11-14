import { create } from 'zustand';

type PendingDeepLinkState = {
  /** Booking to open after login (from notification tap while logged out). */
  pendingBookingId: string | null;
  pendingAction: 'join' | 'reschedule';
  setPendingBookingId: (bookingId: string | null) => void;
  setPendingAction: (action: 'join' | 'reschedule') => void;
  consumePendingBookingId: () => string | null;
  consumePendingAction: () => 'join' | 'reschedule';
};

export const usePendingDeepLinkStore = create<PendingDeepLinkState>((set, get) => ({
  pendingBookingId: null,
  pendingAction: 'join',
  setPendingBookingId: (bookingId) =>
    set({ pendingBookingId: bookingId && bookingId.trim() ? bookingId.trim() : null }),
  setPendingAction: (action) => set({ pendingAction: action }),
  consumePendingBookingId: () => {
    const id = get().pendingBookingId;
    if (id) set({ pendingBookingId: null });
    return id;
  },
  consumePendingAction: () => {
    const action = get().pendingAction;
    set({ pendingAction: 'join' });
    return action;
  },
}));
