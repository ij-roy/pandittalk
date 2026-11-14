import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { SessionReminderBanner } from '@/components/SessionReminderBanner';
import { getBookingById, getUserBookings, type Booking } from '@/lib/bookingApi';
import { bookingStartTimeIso } from '@/lib/bookingDisplay';
import { bookingDurationMinutes } from '@/lib/bookingPricing';
import { isJoinableChatBooking } from '@/lib/chatBookingStatus';
import { chatSocket } from '@/lib/chatSocket';
import {
  getInitialNotificationOpen,
  handleLocalNotificationResponse,
  presentImmediateNotification,
  syncAllBookingReminders,
} from '@/lib/localNotificationScheduler';
import type { SessionNotificationAction } from '@/lib/notificationActions';
import { isAbandonedRechargeResponse } from '@/lib/abandonedRecharge';
import {
  dailyHoroscopeSignFromResponse,
  isDailyHoroscopeResponse,
} from '@/lib/horoscopeReminderSchedule';
import { getUnreadCount } from '@/lib/notificationApi';
import { loadNotificationPrefs } from '@/lib/notificationPreferences';
import { registerRemotePushToken } from '@/lib/pushRegistration';
import {
  scheduleSessionReminders,
  scheduleSessionRemindersForBookings,
  type ReminderThresholdSec,
} from '@/lib/sessionReminderScheduler';
import type { Notification, NotificationType } from '@/store/useNotificationStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveChatViewStore } from '@/store/useActiveChatViewStore';
import { usePendingDeepLinkStore } from '@/store/usePendingDeepLinkStore';

const IN_SESSION_THRESHOLDS = [1800, 600, 300] as const;
const THRESHOLD_TOLERANCE = 2;
const MAX_SCHEDULE_AHEAD_MS = 7 * 24 * 60 * 60 * 1000;

type BannerState = {
  title: string;
  body: string;
  urgent: boolean;
  bookingId: string | null;
  showJoinNow: boolean;
};

const SESSION_STARTED_TYPE: NotificationType = 'session_started';

function preSessionReminderCopy(
  threshold: ReminderThresholdSec,
  panditLabel: string,
  durationMinutes: number,
): { title: string; body: string; urgent: boolean } {
  const minutes = threshold / 60;
  return {
    title: `Session in ${minutes} minutes`,
    body: `Your ${durationMinutes}-min session with ${panditLabel} starts soon.`,
    urgent: threshold === 300,
  };
}

function inSessionThresholdMessage(seconds: number): {
  title: string;
  body: string;
  urgent: boolean;
} {
  if (seconds <= 300) {
    return {
      title: '5 minutes remaining',
      body: 'Your session ends soon.',
      urgent: true,
    };
  }
  if (seconds <= 600) {
    return {
      title: '10 minutes remaining',
      body: 'Your session has 10 minutes left.',
      urgent: false,
    };
  }
  return {
    title: '30 minutes remaining',
    body: 'Your session has 30 minutes left.',
    urgent: false,
  };
}

function matchesInSessionThreshold(seconds: number, threshold: number): boolean {
  return seconds <= threshold && seconds >= threshold - THRESHOLD_TOLERANCE;
}

function isSessionJoinable(booking: Booking): boolean {
  if (booking.format.trim().toLowerCase() === 'chat') {
    return isJoinableChatBooking(booking);
  }
  if (booking.status === 'in_progress') return true;
  if (booking.status !== 'confirmed' || !booking.startTime) return false;
  const startMs = new Date(booking.startTime).getTime();
  if (Number.isNaN(startMs)) return false;
  const now = Date.now();
  return now >= startMs - 30 * 60_000;
}

function bookingDuration(booking: Booking): number {
  return bookingDurationMinutes(booking.depth);
}

function upcomingConfirmedBookings(bookings: Booking[]): Array<{
  id: string;
  startsAt: string;
  durationMinutes: number;
  panditLabel: string;
}> {
  const now = Date.now();
  return bookings
    .filter((b) => {
      if (b.status !== 'confirmed') return false;
      const startsAt = bookingStartTimeIso(b);
      if (!startsAt) return false;
      const startMs = new Date(startsAt).getTime();
      if (Number.isNaN(startMs) || startMs <= now) return false;
      if (startMs - now > MAX_SCHEDULE_AHEAD_MS) return false;
      return true;
    })
    .map((b) => ({
      id: b.id,
      startsAt: bookingStartTimeIso(b)!,
      durationMinutes: bookingDuration(b),
      panditLabel: b.panditName?.trim() || 'your pandit',
    }));
}

async function resolveJoinable(bookingId: string | null): Promise<boolean> {
  if (!bookingId) return false;
  try {
    const booking = await getBookingById(bookingId);
    return isSessionJoinable(booking);
  } catch {
    return false;
  }
}

type Props = {
  children: React.ReactNode;
};

export function NotificationProvider({ children }: Props) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authHydrated = useAuthStore((s) => s.authHydrated);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const focusedChatBookingId = useActiveChatViewStore((s) => s.focusedBookingId);

  const [banner, setBanner] = useState<BannerState | null>(null);
  const shownRemindersRef = useRef(new Set<string>());
  const bookingsMetaRef = useRef(
    new Map<string, { durationMinutes: number; panditLabel: string }>(),
  );

  const refreshUnreadCount = useCallback(async () => {
    if (!accessToken) return;
    const startedEpoch = useNotificationStore.getState().unreadEpoch;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count, startedEpoch);
    } catch {
      // Keep last known count.
    }
  }, [accessToken, setUnreadCount]);

  useEffect(() => {
    if (!authHydrated || !accessToken) return;
    void registerRemotePushToken();
  }, [authHydrated, accessToken]);

  const dismissBanner = useCallback(() => {
    setBanner(null);
  }, []);

  const navigateToSession = useCallback(
    async (bookingId: string) => {
      try {
        const booking = await getBookingById(bookingId);
        const panditName = booking.panditName ?? 'Pandit';
        const format = booking.format.toLowerCase();

        if (format === 'chat') {
          router.push({
            pathname: '/session/chat',
            params: {
              bookingId: booking.id,
              panditName,
              panditId: booking.panditId,
            },
          });
          return;
        }

        if (format === 'audio') {
          router.push({
            pathname: '/session/audio',
            params: { bookingId: booking.id, panditName },
          });
          return;
        }

        if (format === 'video') {
          router.push({
            pathname: '/session/video',
            params: { bookingId: booking.id, panditName },
          });
        }
      } catch {
        // Navigation failed — user can open from notifications list.
      }
    },
    [router],
  );

  const openSessionOrQueueLogin = useCallback(
    (bookingId: string) => {
      const { accessToken: token, authHydrated: hydrated } = useAuthStore.getState();
      if (!hydrated || !token) {
        usePendingDeepLinkStore.getState().setPendingBookingId(bookingId);
        if (hydrated && !token) {
          router.replace('/login');
        }
        return;
      }
      void navigateToSession(bookingId);
    },
    [navigateToSession, router],
  );

  const navigateToReschedule = useCallback(
    async (bookingId: string) => {
      try {
        const booking = await getBookingById(bookingId);
        router.push({
          pathname: '/booking/select-slot',
          params: {
            panditId: booking.panditId,
            panditName: booking.panditName ?? 'Pandit',
            area: booking.area,
            depth: booking.depth,
            format: booking.format,
            totalPrice: String(booking.totalPrice ?? booking.coinsDeducted ?? 0),
            durationMinutes: String(bookingDurationMinutes(booking.depth)),
            rescheduleBookingId: booking.id,
          },
        });
      } catch {
        void navigateToSession(bookingId);
      }
    },
    [navigateToSession, router],
  );

  const openFromNotification = useCallback(
    (bookingId: string, action: SessionNotificationAction) => {
      const { accessToken: token, authHydrated: hydrated } = useAuthStore.getState();
      if (!hydrated || !token) {
        usePendingDeepLinkStore.getState().setPendingBookingId(bookingId);
        usePendingDeepLinkStore.getState().setPendingAction(
          action === 'reschedule' ? 'reschedule' : 'join',
        );
        if (hydrated && !token) {
          router.replace('/login');
        }
        return;
      }
      if (action === 'reschedule') {
        void navigateToReschedule(bookingId);
        return;
      }
      void navigateToSession(bookingId);
    },
    [navigateToReschedule, navigateToSession, router],
  );

  const showReminderBanner = useCallback(
    async (opts: {
      title: string;
      body: string;
      urgent: boolean;
      bookingId: string | null;
      dedupeKey: string;
    }) => {
      if (shownRemindersRef.current.has(opts.dedupeKey)) return;
      shownRemindersRef.current.add(opts.dedupeKey);

      const showJoinNow = await resolveJoinable(opts.bookingId);
      setBanner({
        title: opts.title,
        body: opts.body,
        urgent: opts.urgent,
        bookingId: opts.bookingId,
        showJoinNow,
      });
    },
    [],
  );

  const handlePreSessionReminderFire = useCallback(
    (bookingId: string, threshold: ReminderThresholdSec) => {
      const meta = bookingsMetaRef.current.get(bookingId);
      const durationMinutes = meta?.durationMinutes ?? 15;
      const panditLabel = meta?.panditLabel ?? 'your pandit';
      const { title, body, urgent } = preSessionReminderCopy(
        threshold,
        panditLabel,
        durationMinutes,
      );
      void showReminderBanner({
        title,
        body,
        urgent,
        bookingId,
        dedupeKey: `pre-${bookingId}-${threshold}`,
      });
    },
    [showReminderBanner],
  );

  const syncPreSessionSchedulers = useCallback(async () => {
    if (!accessToken) return;
    try {
      const bookings = await getUserBookings();
      const upcoming = upcomingConfirmedBookings(bookings);
      bookingsMetaRef.current = new Map(
        upcoming.map((b) => [
          b.id,
          { durationMinutes: b.durationMinutes, panditLabel: b.panditLabel },
        ]),
      );
      return upcoming;
    } catch {
      return [];
    }
  }, [accessToken]);

  const handleSocketNotification = useCallback(
    (notification: Notification) => {
      if (
        notification.type === 'new_message' &&
        notification.bookingId &&
        notification.bookingId === focusedChatBookingId
      ) {
        return;
      }

      addNotification(notification);

      if (
        notification.type === 'new_message' &&
        notification.bookingId &&
        notification.bookingId !== focusedChatBookingId
      ) {
        void (async () => {
          const prefs = await loadNotificationPrefs();
          if (!prefs.new_message) return;
          await presentImmediateNotification({
            title: notification.title,
            body: notification.body,
            data: {
              bookingId: notification.bookingId!,
              type: 'new_message',
              notificationId: notification.id,
            },
          });
        })();
      }

      if (notification.type !== SESSION_STARTED_TYPE) return;

      const dedupeKey = notification.bookingId
        ? `${notification.bookingId}-session_started`
        : notification.id;

      void showReminderBanner({
        title: notification.title,
        body: notification.body,
        urgent: false,
        bookingId: notification.bookingId,
        dedupeKey,
      });
    },
    [addNotification, focusedChatBookingId, showReminderBanner],
  );

  const handleTimeRemaining = useCallback(
    (seconds: number, bookingId: string | null) => {
      const activeBookingId = chatSocket.getActiveBookingId();
      const resolvedBookingId = bookingId ?? activeBookingId;
      if (!resolvedBookingId || resolvedBookingId !== activeBookingId) return;

      const durationMinutes = chatSocket.getActiveSessionDurationMinutes();
      const durationSeconds =
        durationMinutes != null && durationMinutes > 0 ? durationMinutes * 60 : null;

      for (const threshold of IN_SESSION_THRESHOLDS) {
        if (durationSeconds != null && durationSeconds <= threshold) {
          continue;
        }
        if (!matchesInSessionThreshold(seconds, threshold)) continue;

        const { title, body, urgent } = inSessionThresholdMessage(threshold);
        void showReminderBanner({
          title,
          body,
          urgent,
          bookingId: resolvedBookingId,
          dedupeKey: `in-session-${resolvedBookingId}-${threshold}`,
        });
        break;
      }
    },
    [showReminderBanner],
  );

  useEffect(() => {
    if (!authHydrated || !accessToken) {
      chatSocket.setOnNewNotification(null);
      chatSocket.setOnTimeRemaining(null);
      chatSocket.setOnWaitingForStart(null);
      return;
    }

    chatSocket.connect(accessToken);
    chatSocket.setOnNewNotification(handleSocketNotification);
    chatSocket.setOnTimeRemaining(handleTimeRemaining);

    chatSocket.setOnWaitingForStart(({ bookingId, startsAt }) => {
      const meta = bookingsMetaRef.current.get(bookingId);
      scheduleSessionReminders({
        bookingId,
        startsAt,
        durationMinutes: meta?.durationMinutes,
        onFire: (threshold) => handlePreSessionReminderFire(bookingId, threshold),
      });
    });

    void refreshUnreadCount();

    return () => {
      chatSocket.setOnNewNotification(null);
      chatSocket.setOnTimeRemaining(null);
      chatSocket.setOnWaitingForStart(null);
    };
  }, [
    accessToken,
    authHydrated,
    handleSocketNotification,
    handleTimeRemaining,
    handlePreSessionReminderFire,
    refreshUnreadCount,
  ]);

  useEffect(() => {
    if (!accessToken) return;

    let cleanupSchedulers: (() => void) | undefined;

    const rescheduleForeground = () => {
      cleanupSchedulers?.();
      cleanupSchedulers = undefined;
      void (async () => {
        const upcoming = await syncPreSessionSchedulers();
        if (!upcoming?.length) return;
        cleanupSchedulers = scheduleSessionRemindersForBookings(
          upcoming.map((b) => ({
            id: b.id,
            startsAt: b.startsAt,
            durationMinutes: b.durationMinutes,
          })),
          handlePreSessionReminderFire,
        );
      })();
    };

    rescheduleForeground();

    const onAppState = (state: AppStateStatus) => {
      if (state !== 'active') return;
      chatSocket.connect(accessToken);
      void refreshUnreadCount();
      void syncAllBookingReminders();
      rescheduleForeground();
    };

    const sub = AppState.addEventListener('change', onAppState);
    return () => {
      sub.remove();
      cleanupSchedulers?.();
    };
  }, [
    accessToken,
    syncPreSessionSchedulers,
    handlePreSessionReminderFire,
    refreshUnreadCount,
  ]);

  useEffect(() => {
    const sub = handleLocalNotificationResponse((open) => {
      openFromNotification(open.bookingId, open.action);
    });
    return () => sub.remove();
  }, [openFromNotification]);

  // Cold start from a notification tap. Wait until sign-in is restored, and only once.
  const coldStartStartedRef = useRef(false);
  useEffect(() => {
    if (!authHydrated) return;
    if (coldStartStartedRef.current) return;
    coldStartStartedRef.current = true;
    void (async () => {
      const open = await getInitialNotificationOpen();
      if (!open) return;
      openFromNotification(open.bookingId, open.action);
    })();
  }, [authHydrated, openFromNotification]);

  // After login, resume the queued session deep link.
  useEffect(() => {
    if (!authHydrated || !accessToken) return;
    const bookingId = usePendingDeepLinkStore.getState().consumePendingBookingId();
    const action = usePendingDeepLinkStore.getState().consumePendingAction();
    if (!bookingId) return;
    if (action === 'reschedule') {
      void navigateToReschedule(bookingId);
      return;
    }
    void navigateToSession(bookingId);
  }, [authHydrated, accessToken, navigateToReschedule, navigateToSession]);

  useEffect(() => {
    if (!authHydrated || accessToken) return;
    const pending = usePendingDeepLinkStore.getState().pendingBookingId;
    if (!pending) return;
    router.replace('/login');
  }, [authHydrated, accessToken, router]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (isDailyHoroscopeResponse(response)) {
        const sign = dailyHoroscopeSignFromResponse(response);
        router.push({
          pathname: '/tools/horoscope',
          params: sign ? { sign } : {},
        });
        return;
      }
      if (!isAbandonedRechargeResponse(response)) return;
      router.push('/wallet/recharge');
    });
    return () => sub.remove();
  }, [router]);

  const onJoinNow = useCallback(() => {
    if (!banner?.bookingId) return;
    dismissBanner();
    openSessionOrQueueLogin(banner.bookingId);
  }, [banner?.bookingId, dismissBanner, openSessionOrQueueLogin]);

  return (
    <>
      {children}
      <SessionReminderBanner
        visible={banner !== null}
        title={banner?.title ?? ''}
        body={banner?.body ?? ''}
        urgent={banner?.urgent ?? false}
        showJoinNow={banner?.showJoinNow ?? false}
        onJoinNow={onJoinNow}
        onDismiss={dismissBanner}
      />
    </>
  );
}
