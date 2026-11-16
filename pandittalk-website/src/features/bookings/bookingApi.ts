import { api } from '@/lib/api/client';
import type { Format } from './types';

export type BookingDepth = 'entry' | 'standard' | 'deep';
export type BookingCatalog = {
  version: number;
  sessionModel: 'legacy_timed';
  scheduled: {
    depths: Array<{ key: BookingDepth; label: string; durationMinutes: number; basePrice: number }>;
    formats: Array<{ key: Format; label: string; surcharge: number }>;
    bufferMinutes: number;
    preStartJoinWindowMinutes: number;
  };
  chatNow: {
    enabled: boolean;
    durationMinutes: number;
    totalPrice: number;
    noShowRefundMinutes: number;
    maxQueueDepth: number;
    maxQueueWaitMinutes: number;
    queueTurnTimeoutSeconds: number;
  };
  session: { gracePeriodSeconds: number; warningSeconds: number; panditReconnectSeconds: number };
  cancellation: {
    confirmedBeforeStart: string;
    panditNoShow: string;
    panditDisconnect: string;
    refundDestination: string;
  };
  areas: Array<{ key: string; label: string }>;
};

export type BookingQuote = {
  sessionModel: 'legacy_timed';
  depth: BookingDepth;
  format: Format;
  durationMinutes: number;
  totalPrice: number;
  coinsDeducted: number;
};

export type DisplaySlot = { startTime: string; status: 'available' | 'booked' };
export type PanditLiveStatus = {
  panditId: string;
  state: 'available' | 'busy' | 'offline';
  activeBookingId: string | null;
  estimatedAvailableAt: string | null;
  queueLength: number;
  maxQueueDepth: number;
  canJoinQueue: boolean;
};

export function bookingCatalogPath() { return '/booking-catalog'; }
export function bookingQuotePath(depth: BookingDepth, format: Format) { return `/booking-catalog/quote?depth=${encodeURIComponent(depth)}&format=${encodeURIComponent(format)}`; }
export function expertSlotsPath(panditId: string, date: string, durationMinutes: number) { return `/experts/${encodeURIComponent(panditId)}/all-slots?date=${encodeURIComponent(date)}&duration=${durationMinutes}`; }
export function panditStatusPath(panditId: string) { return `/bookings/pandit/${encodeURIComponent(panditId)}/status`; }

export function getBookingCatalog() { return api<BookingCatalog>(bookingCatalogPath()); }
export function getBookingQuote(depth: BookingDepth, format: Format) { return api<BookingQuote>(bookingQuotePath(depth, format)); }
export function getChatNowQuote() { return api<BookingQuote>('/booking-catalog/quote?mode=chat-now'); }
export function getAllSlots(panditId: string, date: string, durationMinutes: number) { return api<DisplaySlot[]>(expertSlotsPath(panditId, date, durationMinutes)); }
export function getPanditStatus(panditId: string) { return api<PanditLiveStatus>(panditStatusPath(panditId)); }

export function createScheduledBooking(payload: { panditId: string; startTime: string; area: string; depth: BookingDepth; format: Format; notes?: string }) {
  return api<{ id: string; panditId: string; startTime: string; durationMinutes: number; totalPrice: number; coinsDeducted: number; status: string }>('/bookings', {
    method: 'POST',
    body: JSON.stringify({ ...payload, sessionModel: 'legacy_timed' }),
  });
}

export function createChatNow(payload: { panditId: string; area: string; notes?: string }) {
  return api<{ id: string; panditId: string; startTime: string; durationMinutes: number; totalPrice: number; coinsDeducted: number; status: string }>('/bookings/chat-now', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function joinChatQueue(panditId: string) { return api<{ position: number; estimatedWaitMinutes: number; queueLength: number }>('/bookings/chat-now/queue', { method: 'POST', body: JSON.stringify({ panditId }) }); }
export function leaveChatQueue(panditId: string) { return api<void>('/bookings/chat-now/queue', { method: 'DELETE', body: JSON.stringify({ panditId }) }); }
export function rescheduleBooking(id: string, startTime: string) {
  return api<unknown>(`/bookings/${encodeURIComponent(id)}/reschedule`, {
    method: 'PATCH',
    body: JSON.stringify({ startTime }),
  });
}
