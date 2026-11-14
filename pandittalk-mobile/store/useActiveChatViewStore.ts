import { create } from 'zustand';

type ActiveChatViewState = {
  focusedBookingId: string | null;
  setFocusedBookingId: (bookingId: string | null) => void;
};

export const useActiveChatViewStore = create<ActiveChatViewState>((set) => ({
  focusedBookingId: null,
  setFocusedBookingId: (bookingId) => set({ focusedBookingId: bookingId }),
}));
