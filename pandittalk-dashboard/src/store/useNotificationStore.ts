import { create } from 'zustand';
import type { Notification, NotificationType } from '../types';
import { getUnreadCount } from '../lib/notificationApi';

interface NotificationState {
  notifications: Notification[];
  serverUnreadCount: number;
  localUnreadCount: number;
  addNotification: (notification: Notification) => void;
  prependLocal: (opts: {
    type: NotificationType;
    title: string;
    body: string;
    bookingId?: string | null;
    id?: string;
  }) => Notification;
  setNotifications: (notifications: Notification[]) => void;
  setServerUnreadCount: (count: number) => void;
  markAllRead: () => void;
  refreshUnreadCount: () => Promise<void>;
  mergeServerNotifications: (server: Notification[]) => void;
  reset: () => void;
}

function localId(type: NotificationType, suffix: string): string {
  return `local:${type}:${suffix}`;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  serverUnreadCount: 0,
  localUnreadCount: 0,

  addNotification: (notification) =>
    set((state) => {
      if (state.notifications.some((n) => n.id === notification.id)) {
        return state;
      }
      return {
        notifications: [notification, ...state.notifications],
        localUnreadCount: notification.isRead
          ? state.localUnreadCount
          : state.localUnreadCount +
            (notification.id.startsWith('local:') ? 1 : 0),
      };
    }),

  prependLocal: (opts) => {
    const id =
      opts.id ??
      localId(opts.type, opts.bookingId ?? `${Date.now()}`);
    const notification: Notification = {
      id,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      bookingId: opts.bookingId ?? null,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      if (state.notifications.some((n) => n.id === notification.id)) {
        return state;
      }
      return {
        notifications: [notification, ...state.notifications],
        localUnreadCount: state.localUnreadCount + 1,
      };
    });

    return notification;
  },

  setNotifications: (notifications) => set({ notifications }),

  setServerUnreadCount: (count) => set({ serverUnreadCount: count }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      localUnreadCount: 0,
    })),

  refreshUnreadCount: async () => {
    try {
      const count = await getUnreadCount();
      set({ serverUnreadCount: count });
    } catch {
      // Keep last known count.
    }
  },

  mergeServerNotifications: (server) => {
    const localOnly = get().notifications.filter((n) =>
      n.id.startsWith('local:'),
    );
    const merged = [...server];
    for (const local of localOnly) {
      if (!merged.some((n) => n.id === local.id)) {
        merged.push(local);
      }
    }
    merged.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    set({ notifications: merged });
  },

  reset: () =>
    set({
      notifications: [],
      serverUnreadCount: 0,
      localUnreadCount: 0,
    }),
}));

export function getTotalUnreadCount(): number {
  const { serverUnreadCount, localUnreadCount } =
    useNotificationStore.getState();
  return serverUnreadCount + localUnreadCount;
}
