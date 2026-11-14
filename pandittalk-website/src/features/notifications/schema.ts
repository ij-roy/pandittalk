export function notificationDestination(bookingId: unknown): string | null {
  return typeof bookingId === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(bookingId)
    ? '/bookings/' + encodeURIComponent(bookingId)
    : null;
}

export const notificationLabels: Record<string, string> = {
  booking_confirmed: 'Booking confirmed',
  session_reminder_30: 'Session reminder',
  session_reminder_10: 'Session reminder',
  session_reminder_5: 'Session reminder',
  session_started: 'Session started',
  session_ended: 'Session ended',
  new_message: 'New message',
  chat_now_accepted: 'Instant chat (legacy)',
  chat_now_missed: 'Instant chat missed (legacy)',
};

/** Short CTA for booking-linked notices — destinations are booking detail until format is known. */
export function notificationActionLabel(type: string): string {
  if (type === 'session_started' || type.startsWith('session_reminder')) return 'View booking';
  if (type === 'new_message') return 'View booking';
  if (type === 'session_ended') return 'View booking';
  if (type.startsWith('chat_now')) return 'View booking';
  return 'View booking';
}