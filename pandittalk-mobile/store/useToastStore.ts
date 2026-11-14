import { create } from 'zustand';

type ToastVariant = 'default' | 'error';

type ToastState = {
  message: string | null;
  variant: ToastVariant;
  showToast: (message: string, variant?: ToastVariant) => void;
  clearToast: () => void;
};

let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: 'default',
  showToast: (message, variant = 'default') => {
    if (dismissTimer) clearTimeout(dismissTimer);
    set({ message, variant });
    dismissTimer = setTimeout(() => {
      set({ message: null });
      dismissTimer = null;
    }, 3000);
  },
  clearToast: () => {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    set({ message: null });
  },
}));
