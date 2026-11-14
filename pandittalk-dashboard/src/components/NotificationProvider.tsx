import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatSocket } from '../lib/chatSocket';
import {
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from '../lib/browserNotifications';
import {
  getCurrentWeekDaysIST,
  formatTimeIST,
  getISTYmd,
} from '../lib/format';
import {
  requestBookingRefresh,
  showNotificationToast,
} from '../lib/notificationEvents';
import {
  scheduleSessionReminders,
  scheduleSessionRemindersForBookings,
  type ReminderThresholdSec,
} from '../lib/sessionReminderScheduler';
import { fetchPanditMe, getErrorMessage, logoutSession } from '../lib/api';
import { useNotificationStore } from '../store/useNotificationStore';
import { usePanditStore } from '../store/usePanditStore';
import type { Notification, NotificationType } from '../types';

const BROWSER_PUSH_TYPES = new Set<NotificationType>([
  'new_booking',
  'session_reminder_5',
  'new_message',
]);

function reminderTypeForThreshold(
  threshold: ReminderThresholdSec,
): NotificationType {
  if (threshold === 1800) return 'session_reminder_30';
  if (threshold === 600) return 'session_reminder_10';
  return 'session_reminder_5';
}

function reminderCopy(
  threshold: ReminderThresholdSec,
  format: string,
  area: string,
  startsAt: string,
): { title: string; body: string; urgent: boolean } {
  const minutes = threshold / 60;
  return {
    title: `Session in ${minutes} minutes`,
    body: `${format} · ${area} at ${formatTimeIST(startsAt)}`,
    urgent: threshold === 300,
  };
}

function shouldSuppressInSessionNotification(notification: Notification): boolean {
  if (notification.type !== 'new_message' || !notification.bookingId) {
    return false;
  }
  return notification.bookingId === chatSocket.getActiveBookingId();
}

function maybeBrowserPush(notification: Notification): void {
  if (shouldSuppressInSessionNotification(notification)) return;
  if (!BROWSER_PUSH_TYPES.has(notification.type)) return;
  showBrowserNotification({
    title: notification.title,
    body: notification.body,
  });
}

type Props = {
  children: ReactNode;
};

export function NotificationProvider({ children }: Props) {
  const navigate = useNavigate();
  const accessToken = usePanditStore((s) => s.accessToken);
  const panditName = usePanditStore((s) => s.panditName);
  const bookings = usePanditStore((s) => s.bookings);
  const setPanditInfo = usePanditStore((s) => s.setPanditInfo);

  const addNotification = useNotificationStore((s) => s.addNotification);
  const prependLocal = useNotificationStore((s) => s.prependLocal);
  const refreshUnreadCount = useNotificationStore((s) => s.refreshUnreadCount);

  const bookingsRef = useRef(bookings);
  bookingsRef.current = bookings;

  const weekDays = useMemo(() => getCurrentWeekDaysIST(new Date()), []);

  const upcomingWeekBookings = useMemo(
    () =>
      bookings.filter((b) => {
        if (b.status !== 'confirmed') return false;
        const startMs = new Date(b.startTime).getTime();
        if (Number.isNaN(startMs) || startMs <= Date.now()) return false;
        const ymd = getISTYmd(new Date(b.startTime));
        return ymd >= weekDays[0].ymd && ymd <= weekDays[6].ymd;
      }),
    [bookings, weekDays],
  );

  const handleReminderFire = useCallback(
    (
      bookingId: string,
      threshold: ReminderThresholdSec,
      format: string,
      area: string,
      startsAt: string,
    ) => {
      const { title, body } = reminderCopy(threshold, format, area, startsAt);
      prependLocal({
        type: reminderTypeForThreshold(threshold),
        title,
        body,
        bookingId,
        id: `local:${reminderTypeForThreshold(threshold)}:${bookingId}`,
      });
      showNotificationToast(title);
      showBrowserNotification({ title, body });
    },
    [prependLocal],
  );

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    void (async () => {
      try {
        const pandit = await fetchPanditMe();
        if (cancelled) return;
        setPanditInfo(pandit.id, pandit.name, pandit.isOnline);
      } catch (err) {
        if (cancelled) return;
        const message = getErrorMessage(err);
        if (message.includes('No pandit profile linked')) {
          void logoutSession().then(() => {
            navigate('/login', { replace: true });
          });
        }
        return;
      }

      if (cancelled) return;

      requestBrowserNotificationPermission();
      chatSocket.connect(accessToken);
      chatSocket.joinPanditDashboard();
      void refreshUnreadCount();
    })();

    const unsubNotification = chatSocket.onNewNotification((notification) => {
      if (shouldSuppressInSessionNotification(notification)) return;
      addNotification(notification);
      void refreshUnreadCount();
      maybeBrowserPush(notification);
    });

    const unsubBooking = chatSocket.onNewBookingCreated((payload) => {
      const name = panditName ?? 'Pandit';
      const area = payload.area || 'General';
      const notification = prependLocal({
        type: 'new_booking',
        title: 'New session request',
        body: `${name} · ${area} · chat`,
        bookingId: payload.bookingId,
        id: `local:new_booking:${payload.bookingId}`,
      });
      showNotificationToast('New session request');
      showBrowserNotification({
        title: notification.title,
        body: notification.body,
      });
      requestBookingRefresh();
    });

    const handleWaitingForStart = (payload: {
      bookingId: string;
      startsAt: string;
    }) => {
      const booking = bookingsRef.current.find((b) => b.id === payload.bookingId);
      scheduleSessionReminders({
        bookingId: payload.bookingId,
        startsAt: payload.startsAt,
        onFire: (threshold) => {
          handleReminderFire(
            payload.bookingId,
            threshold,
            booking?.format ?? 'session',
            booking?.area ?? '',
            payload.startsAt,
          );
        },
      });
    };

    chatSocket.setOnWaitingForStart(handleWaitingForStart);

    return () => {
      cancelled = true;
      unsubNotification();
      unsubBooking();
      chatSocket.setOnWaitingForStart(null);
    };
  }, [
    accessToken,
    panditName,
    addNotification,
    prependLocal,
    refreshUnreadCount,
    handleReminderFire,
    setPanditInfo,
    navigate,
  ]);

  useEffect(() => {
    if (upcomingWeekBookings.length === 0) return;

    return scheduleSessionRemindersForBookings(
      upcomingWeekBookings.map((b) => ({
        id: b.id,
        startsAt: b.startTime,
      })),
      (bookingId, threshold) => {
        const booking = upcomingWeekBookings.find((b) => b.id === bookingId);
        if (!booking) return;
        handleReminderFire(
          bookingId,
          threshold,
          booking.format,
          booking.area,
          booking.startTime,
        );
      },
    );
  }, [upcomingWeekBookings, handleReminderFire]);

  return <>{children}</>;
}

