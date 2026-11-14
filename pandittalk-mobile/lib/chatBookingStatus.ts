import type { Router } from 'expo-router';

import type { Booking } from '@/lib/bookingApi';
import { bookingDurationMinutes } from '@/lib/bookingPricing';

/** Matches CHAT_NOW_DURATION_MINUTES in app/experts/[id].tsx */
const CHAT_NOW_DURATION_MINUTES = 15;

export type ChatBooking = Booking & { format: 'chat' };

export type ChatStatus =
  | { state: 'none' }
  | { state: 'waiting'; booking: ChatBooking }
  | { state: 'active'; booking: ChatBooking };

function isChatFormat(format: string): boolean {
  return format.trim().toLowerCase() === 'chat';
}

function chatDurationMinutes(booking: Booking): number {
  const fromDepth = bookingDurationMinutes(booking.depth);
  return fromDepth > 0 ? fromDepth : CHAT_NOW_DURATION_MINUTES;
}

/** Derive session end timestamp (ms) from booking fields. */
export function resolveChatEndTimeMs(booking: Booking): number | null {
  const durationMs = chatDurationMinutes(booking) * 60 * 1000;

  if (booking.startTime) {
    const startMs = new Date(booking.startTime).getTime();
    if (!Number.isNaN(startMs)) return startMs + durationMs;
  }

  const createdMs = new Date(booking.createdAt).getTime();
  if (!Number.isNaN(createdMs)) return createdMs + durationMs;

  return null;
}

export function isJoinableChatBooking(booking: Booking, now = Date.now()): boolean {
  if (!isChatFormat(booking.format)) return false;
  if (booking.status === 'completed' || booking.status === 'cancelled') return false;

  if (booking.status === 'in_progress') {
    const endMs = resolveChatEndTimeMs(booking);
    return endMs == null || now < endMs;
  }

  if (booking.status === 'confirmed') {
    const endMs = resolveChatEndTimeMs(booking);
    if (endMs == null) return false;
    return now < endMs;
  }

  return false;
}

function toChatBooking(booking: Booking): ChatBooking | null {
  if (!isChatFormat(booking.format)) return null;
  return booking as ChatBooking;
}

/** First joinable chat across all pandits — prefers in_progress, then nearest end time. */
export function getActiveChatBooking(bookings: Booking[]): ChatBooking | null {
  const now = Date.now();
  const joinable = bookings
    .map(toChatBooking)
    .filter((b): b is ChatBooking => b !== null && isJoinableChatBooking(b, now));

  if (joinable.length === 0) return null;

  const inProgress = joinable.find((b) => b.status === 'in_progress');
  if (inProgress) return inProgress;

  let best: ChatBooking | null = null;
  let bestEnd = Infinity;

  for (const booking of joinable) {
    const endMs = resolveChatEndTimeMs(booking);
    if (endMs == null) continue;
    if (endMs < bestEnd) {
      bestEnd = endMs;
      best = booking;
    }
  }

  return best ?? joinable[0] ?? null;
}

export function getChatBookingStatus(bookings: Booking[], panditId: string): ChatStatus {
  const now = Date.now();
  const match = bookings
    .map(toChatBooking)
    .filter(
      (b): b is ChatBooking =>
        b !== null && b.panditId === panditId && isJoinableChatBooking(b, now),
    )
    .sort((a, b) => {
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
      const aEnd = resolveChatEndTimeMs(a) ?? Infinity;
      const bEnd = resolveChatEndTimeMs(b) ?? Infinity;
      return aEnd - bEnd;
    })[0];

  if (!match) return { state: 'none' };

  if (match.status === 'in_progress') {
    return { state: 'active', booking: match };
  }

  return { state: 'waiting', booking: match };
}

export function getChatRouteParams(booking: Booking): {
  pathname: '/session/chat';
  params: {
    bookingId: string;
    panditName: string;
    panditId: string;
    format: string;
  };
} {
  return {
    pathname: '/session/chat',
    params: {
      bookingId: booking.id,
      panditName: booking.panditName ?? 'Pandit',
      panditId: booking.panditId,
      format: 'chat',
    },
  };
}

export function navigateToChatSession(router: Router, booking: Booking): void {
  router.push(getChatRouteParams(booking));
}
