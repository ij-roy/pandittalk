import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { horoscopeReminderCopy, horoscopeSignLabel } from '@/lib/horoscopeReminder';
import { requestNotificationPermissionIfNeeded } from '@/lib/localNotificationScheduler';
import { isQuietHour } from '@/lib/quietHours';
import { loadQuietHoursEnabled } from '@/lib/quietHoursStore';

const STORAGE_KEY = 'pandittalk.horoscopeSign';
export const DAILY_HOROSCOPE_NOTIFICATION_ID = 'daily-horoscope';
const HOUR = 8;
const MINUTE = 0;

async function alreadyAllowed(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  return (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function readSavedHoroscopeSign(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return horoscopeSignLabel(raw) ? raw!.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

export function isDailyHoroscopeResponse(
  response: Notifications.NotificationResponse,
): boolean {
  const data = response.notification.request.content.data;
  if (!data || typeof data !== 'object') return false;
  return (data as Record<string, unknown>).type === 'daily_horoscope';
}

export function dailyHoroscopeSignFromResponse(
  response: Notifications.NotificationResponse,
): string | null {
  const data = response.notification.request.content.data;
  if (!data || typeof data !== 'object') return null;
  const sign = (data as Record<string, unknown>).sign;
  return typeof sign === 'string' ? sign : null;
}

/** Repeating local reminder named for the sun sign. Skips when the sign is unknown. */
export async function syncHoroscopeReminder(
  signKey: string | null | undefined,
  options?: { askPermission?: boolean },
): Promise<void> {
  const key = signKey?.trim().toLowerCase() ?? '';
  const copy = horoscopeReminderCopy(key);
  if (!copy || !horoscopeSignLabel(key)) return;

  const granted = options?.askPermission
    ? await requestNotificationPermissionIfNeeded()
    : await alreadyAllowed();
  if (!granted) return;

  try {
    await AsyncStorage.setItem(STORAGE_KEY, key);
  } catch {
    // The reminder can still be scheduled for this session.
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('horoscope', {
      name: 'Daily horoscope',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelScheduledNotificationAsync(DAILY_HOROSCOPE_NOTIFICATION_ID).catch(
    () => undefined,
  );
  if (await loadQuietHoursEnabled() && isQuietHour(HOUR, true)) return;
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_HOROSCOPE_NOTIFICATION_ID,
    content: {
      title: copy.title,
      body: copy.body,
      data: { type: 'daily_horoscope', sign: key },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: HOUR,
      minute: MINUTE,
      channelId: Platform.OS === 'android' ? 'horoscope' : undefined,
    },
  });
}
