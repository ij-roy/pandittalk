import axios from 'axios';

import { API_BASE } from '@/lib/authApi';
import type { Notification, NotificationType } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';

function requireAccessToken(): string {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
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
]);

function normalizeNotificationType(v: unknown): NotificationType {
  const key = str(v);
  if (NOTIFICATION_TYPES.has(key)) return key as NotificationType;
  return 'new_message';
}

function normalizeNotification(raw: unknown): Notification | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = str(o.id);
  const title = str(o.title);
  const body = str(o.body);
  const createdAt = str(o.createdAt ?? o.created_at);
  if (!id || !title || !body || !createdAt) return null;

  const bookingIdRaw = o.bookingId ?? o.booking_id;
  const bookingId =
    typeof bookingIdRaw === 'string' && bookingIdRaw.trim() ? bookingIdRaw.trim() : null;

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
  const token = requireAccessToken();
  const res = await axios.get(`${API_BASE}/notifications`, {
    headers: authHeaders(token),
  });
  return unwrapNotificationList(res.data)
    .map(normalizeNotification)
    .filter((n): n is Notification => n !== null);
}

/** `GET /notifications/unread-count` */
export async function getUnreadCount(): Promise<number> {
  const token = requireAccessToken();
  const res = await axios.get(`${API_BASE}/notifications/unread-count`, {
    headers: authHeaders(token),
  });
  const o = asRecord(res.data);
  const countRaw = o?.count;
  if (typeof countRaw === 'number' && Number.isFinite(countRaw)) {
    return Math.max(0, Math.floor(countRaw));
  }
  return 0;
}

/** `PATCH /notifications/read-all` */
export async function markAllNotificationsRead(): Promise<number> {
  const token = requireAccessToken();
  const res = await axios.patch(
    `${API_BASE}/notifications/read-all`,
    {},
    { headers: authHeaders(token) },
  );
  const o = asRecord(res.data);
  const updatedRaw = o?.updated;
  if (typeof updatedRaw === 'number' && Number.isFinite(updatedRaw)) {
    return Math.max(0, Math.floor(updatedRaw));
  }
  return 0;
}

/** `PATCH /notifications/:id/read` */
export async function markNotificationRead(id: string): Promise<Notification> {
  const token = requireAccessToken();
  const res = await axios.patch(
    `${API_BASE}/notifications/${encodeURIComponent(id)}/read`,
    {},
    { headers: authHeaders(token) },
  );
  const notification = normalizeNotification(res.data);
  if (!notification) {
    throw new Error('Invalid notification response');
  }
  return notification;
}

export function normalizeNotificationPayload(raw: unknown): Notification | null {
  return normalizeNotification(raw);
}
