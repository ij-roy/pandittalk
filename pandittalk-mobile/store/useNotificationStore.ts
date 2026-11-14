import { create } from 'zustand';

import { acceptUnreadCount } from '@/lib/unreadBadge';

export type NotificationType =
  | 'booking_confirmed'
  | 'session_reminder_30'
  | 'session_reminder_10'
  | 'session_reminder_5'
  | 'session_started'
  | 'session_ended'
  | 'new_message'
  | 'chat_now_accepted'
  | 'chat_now_missed';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  bookingId: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  unreadEpoch: number;
  addNotification: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number, startedEpoch: number) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  unreadEpoch: 0,

  addNotification: (notification) =>
    set((state) => {
      if (state.notifications.some((n) => n.id === notification.id)) {
        return state;
      }
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
        unreadEpoch: notification.isRead ? state.unreadEpoch : state.unreadEpoch + 1,
      };
    }),

  markRead: (id) =>
    set((state) => {
      const target = state.notifications.find((n) => n.id === id);
      if (!target || target.isRead) return state;
      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        unreadEpoch: state.unreadEpoch + 1,
      };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
      unreadEpoch: state.unreadEpoch + 1,
    })),

  setNotifications: (notifications) => set({ notifications }),

  setUnreadCount: (count, startedEpoch) =>
    set((state) => {
      const next = acceptUnreadCount(state.unreadEpoch, startedEpoch, count);
      if (next == null) return state;
      return { unreadCount: next };
    }),
}));
