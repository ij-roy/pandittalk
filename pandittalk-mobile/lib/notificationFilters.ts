import type { Notification } from '@/store/useNotificationStore';

export type NotificationFilterTab = 'all' | 'messages' | 'updates';

export function isChatNotification(notification: Notification): boolean {
  return notification.type === 'new_message';
}

export function filterNotifications(
  notifications: Notification[],
  tab: NotificationFilterTab,
): Notification[] {
  if (tab === 'messages') {
    return notifications.filter(isChatNotification);
  }
  if (tab === 'updates') {
    return notifications.filter((n) => !isChatNotification(n));
  }
  return notifications;
}
