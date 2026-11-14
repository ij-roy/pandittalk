import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { requestNotificationPermissionIfNeeded } from '@/lib/localNotificationScheduler';
import { ABANDONED_RECHARGE_DELAY_MS } from '@/lib/abandonedRechargeRule';

export const ABANDONED_RECHARGE_ID = 'recharge-abandoned';
export { ABANDONED_RECHARGE_DELAY_MS, shouldRemindAbandonedRecharge } from '@/lib/abandonedRechargeRule';

export async function cancelAbandonedRechargeReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(ABANDONED_RECHARGE_ID).catch(() => undefined);
}

/** One local reminder if a coin pack was opened and payment did not finish. */
export async function scheduleAbandonedRechargeReminder(now = Date.now()): Promise<void> {
  const granted = await requestNotificationPermissionIfNeeded();
  if (!granted) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('wallet', {
      name: 'Wallet',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await cancelAbandonedRechargeReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: ABANDONED_RECHARGE_ID,
    content: {
      title: 'Your coin pack is still waiting',
      body: 'Finish adding coins whenever you are ready.',
      data: { type: 'abandoned_recharge' },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(now + ABANDONED_RECHARGE_DELAY_MS),
      channelId: Platform.OS === 'android' ? 'wallet' : undefined,
    },
  });
}

export function isAbandonedRechargeResponse(
  response: Notifications.NotificationResponse,
): boolean {
  const data = response.notification.request.content.data;
  if (!data || typeof data !== 'object') return false;
  return (data as Record<string, unknown>).type === 'abandoned_recharge';
}
