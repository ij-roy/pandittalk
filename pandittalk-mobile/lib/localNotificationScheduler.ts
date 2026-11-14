import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import type { Booking } from '@/lib/bookingApi';
import { getUserBookings } from '@/lib/bookingApi';
import { bookingDurationMinutes } from '@/lib/bookingPricing';
import {
  markReminderFired,
  thresholdFromLocalNotificationId,
} from '@/lib/sessionReminderScheduler';
import { claimNotificationBooking } from '@/lib/notificationBookingLink';
import {
  JOIN_NOTIFICATION_ACTION,
  RESCHEDULE_NOTIFICATION_ACTION,
  SESSION_NOTIFICATION_CATEGORY,
  sessionNotificationAction,
  type SessionNotificationAction,
} from '@/lib/notificationActions';
import { isQuietHour, istHour, shouldHoldMarketingAlert, shouldSkipQuietReminder } from '@/lib/quietHours';
import { loadQuietHoursEnabled } from '@/lib/quietHoursStore';

const MAX_SCHEDULE_AHEAD_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_LEAD_MS = 30_000;
const REMINDER_OFFSETS_MIN = [30, 10, 5] as const;

let permissionRequested = false;
let categoryReady = false;

async function ensureSessionNotificationCategory(): Promise<void> {
  if (categoryReady) return;
  await Notifications.setNotificationCategoryAsync(SESSION_NOTIFICATION_CATEGORY, [
    {
      identifier: JOIN_NOTIFICATION_ACTION,
      buttonTitle: 'Join',
      options: { opensAppToForeground: true },
    },
    {
      identifier: RESCHEDULE_NOTIFICATION_ACTION,
      buttonTitle: 'Reschedule',
      options: { opensAppToForeground: true },
    },
  ]);
  categoryReady = true;
}
let receivedListenerAttached = false;

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as
      | { type?: string }
      | undefined;
    const appActive = AppState.currentState === 'active';
    const quiet = await loadQuietHoursEnabled();
    if (shouldHoldMarketingAlert(data?.type, quiet, istHour(new Date()))) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }
    // In-app banner covers pre-session thresholds while foregrounded (#269).
    if (appActive && data?.type === 'session_pre_reminder') {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

function ensureReceivedListener(): void {
  if (receivedListenerAttached) return;
  receivedListenerAttached = true;
  Notifications.addNotificationReceivedListener((notification) => {
    const id = notification.request.identifier;
    const parsed = thresholdFromLocalNotificationId(id);
    if (parsed) {
      markReminderFired(parsed.bookingId, parsed.threshold);
    }
  });
}

function notificationId(bookingId: string, minutes: number): string {
  return `booking-${bookingId}-pre-${minutes}`;
}

function parseBookingIdFromResponse(
  response: Notifications.NotificationResponse,
): string | null {
  return claimNotificationBooking(
    response.notification.request.identifier,
    response.actionIdentifier,
    response.notification.request.content.data,
  );
}

function resolveDurationMinutes(booking: Booking): number {
  const fromDepth = bookingDurationMinutes(booking.depth);
  return fromDepth > 0 ? fromDepth : 15;
}

function isTerminalStatus(status: Booking['status']): boolean {
  return status === 'completed' || status === 'cancelled';
}

/** Request permission on first booking confirmation. */
export async function requestNotificationPermissionIfNeeded(): Promise<boolean> {
  ensureReceivedListener();

  if (permissionRequested) {
    const settings = await Notifications.getPermissionsAsync();
    return (
      settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  }

  permissionRequested = true;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('session-reminders', {
      name: 'Session Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync('chat-messages', {
      name: 'Chat Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function cancelBookingReminders(bookingId: string): Promise<void> {
  const ids = REMINDER_OFFSETS_MIN.map((m) => notificationId(bookingId, m));
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)),
  );
}

export async function scheduleBookingReminders(booking: Booking): Promise<void> {
  if (isTerminalStatus(booking.status)) {
    await cancelBookingReminders(booking.id);
    return;
  }

  if (booking.status !== 'confirmed' || !booking.startTime) return;

  const startMs = new Date(booking.startTime).getTime();
  if (Number.isNaN(startMs)) return;

  const now = Date.now();
  if (startMs - now > MAX_SCHEDULE_AHEAD_MS) return;
  if (startMs <= now) return;

  const granted = await requestNotificationPermissionIfNeeded();
  if (!granted) return;

  await ensureSessionNotificationCategory();

  const duration = resolveDurationMinutes(booking);
  const panditLabel = booking.panditName?.trim() || 'your pandit';
  const quiet = await loadQuietHoursEnabled();

  for (const minutesBefore of REMINDER_OFFSETS_MIN) {
    if (minutesBefore > duration) continue;

    const triggerMs = startMs - minutesBefore * 60_000;
    if (triggerMs < now + MIN_LEAD_MS) continue;
    if (shouldSkipQuietReminder(minutesBefore, isQuietHour(istHour(new Date(triggerMs)), quiet))) {
      const skippedId = notificationId(booking.id, minutesBefore);
      await Notifications.cancelScheduledNotificationAsync(skippedId).catch(() => undefined);
      continue;
    }

    const id = notificationId(booking.id, minutesBefore);
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);

    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: `Session in ${minutesBefore} minutes`,
        body: `Your ${duration}-min session with ${panditLabel} starts soon.`,
        data: { bookingId: booking.id, type: 'session_pre_reminder' },
        categoryIdentifier: SESSION_NOTIFICATION_CATEGORY,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerMs),
        channelId: Platform.OS === 'android' ? 'session-reminders' : undefined,
      },
    });
  }
}

/** Reschedule Expo local reminders for all upcoming confirmed bookings. */
export async function syncAllBookingReminders(): Promise<void> {
  await rescheduleUpcomingBookings();
}

export async function rescheduleUpcomingBookings(): Promise<void> {
  try {
    const bookings = await getUserBookings();
    const now = Date.now();

    for (const booking of bookings) {
      if (isTerminalStatus(booking.status)) {
        await cancelBookingReminders(booking.id);
        continue;
      }

      if (booking.status !== 'confirmed' || !booking.startTime) continue;
      const startMs = new Date(booking.startTime).getTime();
      if (Number.isNaN(startMs)) continue;
      if (startMs <= now) continue;
      if (startMs - now > MAX_SCHEDULE_AHEAD_MS) continue;
      await scheduleBookingReminders(booking);
    }
  } catch {
    // User may not be authenticated yet.
  }
}

export type LocalNotificationOpen = {
  bookingId: string;
  action: SessionNotificationAction;
};

function openFromResponse(
  response: Notifications.NotificationResponse,
): LocalNotificationOpen | null {
  const bookingId = parseBookingIdFromResponse(response);
  if (!bookingId) return null;
  return {
    bookingId,
    action: sessionNotificationAction(response.actionIdentifier),
  };
}

export function handleLocalNotificationResponse(
  handler: (open: LocalNotificationOpen) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const open = openFromResponse(response);
    if (open) handler(open);
  });
}

/** Cold-start: notification that launched the app (may be null). */
export async function getInitialNotificationOpen(): Promise<LocalNotificationOpen | null> {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return null;
  const open = openFromResponse(response);
  await Notifications.clearLastNotificationResponseAsync();
  return open;
}

export type ImmediateNotificationPayload = {
  title: string;
  body: string;
  data: { bookingId: string; type: string; notificationId?: string };
};

/** Fire an immediate local notification (e.g. new chat message while app is backgrounded). */
export async function presentImmediateNotification(
  payload: ImmediateNotificationPayload,
): Promise<void> {
  const granted = await requestNotificationPermissionIfNeeded();
  if (!granted) return;

  // Stable id collapses duplicate socket deliveries for the same notification.
  const notifId =
    typeof payload.data.notificationId === 'string' && payload.data.notificationId
      ? `imm-${payload.data.type}-${payload.data.notificationId}`
      : `imm-${payload.data.type}-${payload.data.bookingId}-${payload.title.slice(0, 24)}`;

  await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => undefined);

  await Notifications.scheduleNotificationAsync({
    identifier: notifId,
    content: {
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: true,
    },
    trigger:
      Platform.OS === 'android'
        ? { channelId: 'chat-messages' }
        : null,
  });
}
