import AsyncStorage from '@react-native-async-storage/async-storage';

import type { NotificationType } from '@/store/useNotificationStore';

const STORAGE_KEY = 'pandittalk.notificationPrefs';

export const NOTIFICATION_PREF_TYPES: NotificationType[] = [
  'booking_confirmed',
  'session_reminder_30',
  'session_reminder_10',
  'session_reminder_5',
  'session_started',
  'session_ended',
  'new_message',
  'chat_now_accepted',
  'chat_now_missed',
];

export const NOTIFICATION_PREF_LABELS: Record<NotificationType, string> = {
  booking_confirmed: 'Booking confirmations',
  session_reminder_30: '30-minute session reminders',
  session_reminder_10: '10-minute session reminders',
  session_reminder_5: '5-minute session reminders',
  session_started: 'Session started',
  session_ended: 'Session ended',
  new_message: 'New chat messages',
  chat_now_accepted: 'Chat now accepted',
  chat_now_missed: 'Missed chat requests',
};

export type NotificationPrefs = Record<NotificationType, boolean>;

function defaultPrefs(): NotificationPrefs {
  return NOTIFICATION_PREF_TYPES.reduce(
    (acc, type) => {
      acc[type] = true;
      return acc;
    },
    {} as NotificationPrefs,
  );
}

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPrefs();
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    const base = defaultPrefs();
    for (const type of NOTIFICATION_PREF_TYPES) {
      if (typeof parsed[type] === 'boolean') {
        base[type] = parsed[type]!;
      }
    }
    return base;
  } catch {
    return defaultPrefs();
  }
}

export async function saveNotificationPref(
  type: NotificationType,
  enabled: boolean,
): Promise<NotificationPrefs> {
  const current = await loadNotificationPrefs();
  const next = { ...current, [type]: enabled };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
