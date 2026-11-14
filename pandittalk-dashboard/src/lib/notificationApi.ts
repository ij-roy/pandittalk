import type { Notification, NotificationType } from '../types';
import { api } from './api';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return fallback;
}

const NOTIFICATION_TYPES = new Set<string>([
  'booking_confirmed',
  'session_reminder_30',
  'session_reminder_10',
  'session_reminder_5',
  'session_started',
  'session_ended',
  'new_message',
  'chat_now_accepted',
  'chat_now_missed',
  'new_booking',
]);

function normalizeNotificationType(v: unknown): NotificationType {
  const key = str(v);
  if (NOTIFICATION_TYPES.has(key)) return key as NotificationType;
  return 'new_message';
}

export function normalizeNotification(raw: unknown): Notification | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = str(o.id);
  const title = str(o.title);
  const body = str(o.body);
  const createdAt = str(o.createdAt ?? o.created_at);
  if (!id || !title || !body || !createdAt) return null;

  const bookingIdRaw = o.bookingId ?? o.booking_id;
  const bookingId =
    typeof bookingIdRaw === 'string' && bookingIdRaw.trim()
      ? bookingIdRaw.trim()
      : null;

  return {
    id,
    type: normalizeNotificationType(o.type),
    title,
    body,
    bookingId,
    isRead: Boolean(o.isRead ?? o.is_read),
    createdAt,
  };
}

function unwrapNotificationList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const o = asRecord(raw);
  if (!o) return [];
  const nested = o.data ?? o.notifications ?? o.items;
  return Array.isArray(nested) ? nested : [];
}

/** `GET /notifications` — up to 50 notifications, newest first. */
export async function getNotifications(): Promise<Notification[]> {
  const { data } = await api.get('/notifications');
  return unwrapNotificationList(data)
    .map(normalizeNotification)
    .filter((n): n is Notification => n !== null);
}

/** `GET /notifications/unread-count` */
export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get('/notifications/unread-count');
  const o = asRecord(data);
  const countRaw = o?.count;
  if (typeof countRaw === 'number' && Number.isFinite(countRaw)) {
    return Math.max(0, Math.floor(countRaw));
  }
  return 0;
}

/** `PATCH /notifications/read-all` */
export async function markAllNotificationsRead(): Promise<number> {
  const { data } = await api.patch('/notifications/read-all', {});
  const o = asRecord(data);
  const updatedRaw = o?.updated;
  if (typeof updatedRaw === 'number' && Number.isFinite(updatedRaw)) {
    return Math.max(0, Math.floor(updatedRaw));
  }
  return 0;
}

export function normalizeNotificationPayload(raw: unknown): Notification | null {
  return normalizeNotification(raw);
}
