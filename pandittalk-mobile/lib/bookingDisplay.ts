import type { Booking } from '@/lib/bookingApi';

type BookingWithStartTime = Booking & { start_time?: string };

export function bookingStartTimeIso(booking: BookingWithStartTime): string | null {
  const time = booking.startTime ?? booking.start_time ?? booking.slot?.startTime;
  if (!time?.trim()) return null;
  const trimmed = time.trim();
  if (/^\d{1,2}:\d{2}/.test(trimmed) && !/[tT]/.test(trimmed) && !/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return null;
  }
  if (Number.isNaN(new Date(trimmed).getTime())) return null;
  return trimmed;
}

function withIst(label: string): string {
  if (/\bIST\b/.test(label)) return label;
  return `${label} IST`;
}

export function formatBookingStartTime(iso: string): string {
  const label = new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return withIst(label);
}

export function formatSlotDateTime(date: string, startTime: string | null): string {
  const trimmed = date.trim();
  let datePart = trimmed;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = new Date(`${trimmed.slice(0, 10)}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      datePart = parsed.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }
  if (!startTime?.trim()) return datePart;
  const parts = startTime.trim().split(':');
  const h = Number.parseInt(parts[0] ?? '', 10);
  const m = (parts[1] ?? '00').slice(0, 2);
  if (!Number.isFinite(h)) return withIst(`${datePart} · ${startTime}`);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hours12 = h % 12 || 12;
  return withIst(`${datePart} · ${hours12}:${m.padStart(2, '0')} ${suffix}`);
}

export function bookingDateTimeLabel(booking: BookingWithStartTime): string {
  const iso = bookingStartTimeIso(booking);
  if (iso) return formatBookingStartTime(iso);
  if (booking.slot) return formatSlotDateTime(booking.slot.date, booking.slot.startTime);
  return '—';
}

/** Format a raw ISO startTime string (e.g. from navigation params). */
export function formatStartTimeParam(startTime: string | undefined): string | null {
  const trimmed = startTime?.trim();
  if (!trimmed || Number.isNaN(new Date(trimmed).getTime())) return null;
  return formatBookingStartTime(trimmed);
}
