export const newBookingBlock = 'New conversations are not available to book yet. Pricing, scope, cancellation terms and capacity policy must be approved and supported by the booking service first. Opening this page does not create a booking. No coins will be charged.';
export type Format = 'chat' | 'audio' | 'video';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type Booking = { id: string; panditId: string; panditName?: string; pandit?: {name: string}; area: string; format: Format; status: BookingStatus; startTime: string; endTime?: string; durationMinutes: number; coinsDeducted: number; totalPrice: number; notes: string|null; review: {id: string;rating:number;comment:string|null}|null };

const statusLabels: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function bookingStatusLabel(status: BookingStatus) {
  return statusLabels[status] || status.replaceAll('_', ' ');
}

export function bookingStatusTone(status: BookingStatus) {
  if (status === 'completed') return 'done';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'in_progress') return 'live';
  if (status === 'confirmed') return 'ready';
  return 'pending';
}
export function parseBooking(value: unknown): Booking {
  if (!value || typeof value !== 'object') throw new Error('Invalid booking response.');
  const b = value as Booking;
  if (typeof b.id !== 'string' || !b.id || typeof b.panditId !== 'string' || !['chat','audio','video'].includes(b.format) || !['pending','confirmed','in_progress','completed','cancelled'].includes(b.status) || !Number.isFinite(Date.parse(b.startTime)) || !Number.isFinite(b.durationMinutes) || b.durationMinutes <= 0 || !Number.isFinite(b.coinsDeducted) || b.coinsDeducted < 0 || !Number.isFinite(b.totalPrice) || b.totalPrice < 0) throw new Error('The service returned an unsupported booking. Please contact support.');
  return b;
}
export function canResume(b: Booking) { return ['pending','confirmed','in_progress'].includes(b.status); }
export function calendarText(b: Booking) {
  // Always emit UTC (Z) so calendar apps land on the correct local time worldwide.
  const stamp = (s: string) => new Date(s).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = b.endTime || new Date(Date.parse(b.startTime) + b.durationMinutes * 60000).toISOString();
  const pandit = b.panditName || b.pandit?.name;
  const summary = pandit ? `Pandit Talk with ${pandit}` : 'Pandit Talk consultation';
  const desc = [
    `Format: ${b.format}`,
    b.area ? `Topic: ${b.area}` : '',
    'Join from your Pandit Talk account when the session is open.',
    `https://www.pandittalk.com/bookings/${b.id}`,
  ].filter(Boolean).join('\\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pandit Talk//Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${b.id.replace(/[^\w-]/g, '')}@pandittalk.com`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(b.startTime)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    `URL:https://www.pandittalk.com/bookings/${b.id}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
