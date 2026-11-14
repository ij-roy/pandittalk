const THIRTY_MIN_MS = 30 * 60 * 1000;
const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const SIXTY_MIN_MS = 60 * 60 * 1000;

export type CallBooking = {
  id: string;
  panditId: string;
  panditName: string;
  format: 'audio' | 'video';
  status: string;
  startTime: string;
  endTime: string;
};

export type CallStatus =
  | { state: 'none' }
  | { state: 'upcoming'; startsAt: Date; booking: CallBooking }
  | { state: 'soon'; startsAt: Date; booking: CallBooking }
  | { state: 'waitingRoom'; startsAt: Date; booking: CallBooking }
  | { state: 'active'; booking: CallBooking }
  | { state: 'expired' };

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return fallback;
}

function idStr(v: unknown): string {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return '';
}

function parseIsoTime(v: unknown): string | null {
  const s = str(v);
  if (!s || Number.isNaN(new Date(s).getTime())) return null;
  return s;
}

function resolveFormat(raw: string): 'audio' | 'video' | null {
  const key = raw.trim().toLowerCase();
  if (key === 'audio' || key === 'video') return key;
  return null;
}

function resolveEndTime(o: Record<string, unknown>, startTime: string): string | null {
  const direct = parseIsoTime(o.endTime ?? o.end_time);
  if (direct) return direct;

  const durationRaw = o.durationMinutes ?? o.duration_minutes;
  const duration =
    typeof durationRaw === 'number' && Number.isFinite(durationRaw)
      ? durationRaw
      : typeof durationRaw === 'string' && durationRaw.trim()
        ? Number(durationRaw)
        : NaN;

  if (!Number.isFinite(duration) || duration <= 0) return null;

  const startMs = new Date(startTime).getTime();
  if (Number.isNaN(startMs)) return null;
  return new Date(startMs + duration * 60 * 1000).toISOString();
}

function toCallBooking(raw: unknown): CallBooking | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = idStr(o.id);
  const panditId = idStr(o.panditId ?? o.pandit_id);
  const startTime = parseIsoTime(o.startTime ?? o.start_time);
  if (!id || !panditId || !startTime) return null;

  const endTime = resolveEndTime(o, startTime);
  if (!endTime) return null;

  const format = resolveFormat(str(o.format));
  if (!format) return null;

  return {
    id,
    panditId,
    panditName: str(o.panditName ?? o.pandit_name),
    format,
    status: str(o.status),
    startTime,
    endTime,
  };
}

function pickNearestBooking(bookings: CallBooking[], now: number): CallBooking | null {
  let best: CallBooking | null = null;
  let bestStart = Infinity;

  for (const booking of bookings) {
    const startMs = new Date(booking.startTime).getTime();
    const endMs = new Date(booking.endTime).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) continue;
    if (now > endMs) continue;
    if (startMs < bestStart) {
      bestStart = startMs;
      best = booking;
    }
  }

  return best;
}

export function getCallBookingStatus(bookings: any[], panditId: string): CallStatus {
  const now = Date.now();

  const matches = bookings
    .map(toCallBooking)
    .filter((b): b is CallBooking => b !== null)
    .filter(
      (b) =>
        b.panditId === panditId &&
        b.status === 'confirmed' &&
        (b.format === 'audio' || b.format === 'video'),
    );

  const booking = pickNearestBooking(matches, now);
  if (!booking) return { state: 'none' };

  const startsAt = new Date(booking.startTime);
  const endsAt = new Date(booking.endTime);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { state: 'none' };
  }

  const startMs = startsAt.getTime();
  const endMs = endsAt.getTime();

  if (now < startMs - THIRTY_MIN_MS) {
    return { state: 'upcoming', startsAt, booking };
  }
  if (now < startMs - FIFTEEN_MIN_MS) {
    return { state: 'soon', startsAt, booking };
  }
  if (now < startMs) {
    return { state: 'waitingRoom', startsAt, booking };
  }
  if (now <= endMs) {
    return { state: 'active', booking };
  }
  return { state: 'expired' };
}

export function getCallRoute(booking: CallBooking): '/session/audio' | '/session/video' {
  if (booking.format === 'audio') return '/session/audio';
  return '/session/video';
}

export function formatTimeUntil(date: Date): string {
  const diffMs = date.getTime() - Date.now();

  if (diffMs < SIXTY_MIN_MS) {
    const minutes = Math.max(1, Math.ceil(diffMs / 60000));
    return `starts in ${minutes} min`;
  }

  const hours24 = date.getHours();
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `starts at ${`${hours12}`.padStart(2, '0')}:${minutes} ${suffix}`;
}
