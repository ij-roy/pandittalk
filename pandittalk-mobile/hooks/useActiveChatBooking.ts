import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getUserBookings, type Booking } from '@/lib/bookingApi';
import {
  getActiveChatBooking,
  getChatBookingStatus,
  type ChatBooking,
  type ChatStatus,
} from '@/lib/chatBookingStatus';
import { useAuthStore } from '@/store/useAuthStore';

const REFRESH_INTERVAL_MS = 30_000;

export function useActiveChatBooking() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshBookings = useCallback(async () => {
    if (!accessToken) {
      setBookings([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getUserBookings();
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      void refreshBookings();
    }, [refreshBookings]),
  );

  useEffect(() => {
    if (!accessToken) return;
    const id = setInterval(() => void refreshBookings(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [accessToken, refreshBookings]);

  const activeChat = useMemo<ChatBooking | null>(
    () => getActiveChatBooking(bookings),
    [bookings],
  );

  const getChatStatus = useCallback(
    (panditId: string): ChatStatus => getChatBookingStatus(bookings, panditId),
    [bookings],
  );

  return {
    bookings,
    activeChat,
    getChatStatus,
    loading,
    refreshBookings,
  };
}
