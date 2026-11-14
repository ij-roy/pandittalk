import axios, { isAxiosError } from 'axios';

import { API_BASE } from '@/lib/authApi';
import { BOOKING_DEPTHS, formatByKey } from '@/lib/bookingPricing';
import { resolveExpertDisplayName } from '@/lib/expertsApi';
import { useAuthStore } from '@/store/useAuthStore';

/** Availability window for a pandit — from expert detail `slots`. */
export type Slot = {
  id: string;
  panditId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  isBooked: boolean;
};

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/** User session booking — matches typical NestJS / Prisma booking payload. */
export type Booking = {
  id: string;
  userId: string;
  panditId: string;
  slotId: string;
  area: string;
  depth: string;
  format: string;
  status: BookingStatus;
  /** Booked slot instant (ISO UTC) from API. */
  startTime: string | null;
  slot: Slot | null;
  review: Review | null;
  coinsDeducted?: number | null;
  totalPrice?: number | null;
  /** Pandit display name when included on the booking payload. */
  panditName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Review = {
  id: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type CreateBookingPayload = {
  panditId: string;
  startTime: string;
  area: string;
  depth: string;
  format: string;
  notes?: string;
};

export type UpdateBookingStatusPayload = {
  status: 'completed' | 'cancelled';
};

export type SubmitReviewPayload = {
  rating: number;
  comment?: string;
};

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

function resolvePanditId(o: Record<string, unknown>): string {
  const nestedPandit = asRecord(o.pandit ?? o.expert ?? o.pandit_user ?? o.panditUser);
  return (
    idStr(o.pandit_id ?? o.panditId ?? o.expert_id ?? o.expertId) || idStr(nestedPandit?.id)
  );
}

function resolvePanditName(o: Record<string, unknown>): string | null {
  const flat = str(o.pandit_name) || str(o.panditName);
  if (flat) return flat;

  const nested = asRecord(o.pandit ?? o.expert ?? o.pandit_user ?? o.panditUser);
  if (nested) return resolveExpertDisplayName(nested);

  return null;
}

function bool(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === 1) return true;
  if (v === 'false' || v === 0) return false;
  return fallback;
}

function numOrNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function requireAccessToken(): string {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseSlotDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const parsed = new Date(dateOnly ? `${trimmed}T00:00:00` : trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isoDateOnly(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  return trimmed;
}

function inferDepthFromTotal(totalPrice: unknown, format: string): string {
  const total =
    typeof totalPrice === 'number'
      ? totalPrice
      : typeof totalPrice === 'string'
        ? Number(totalPrice)
        : NaN;
  if (!Number.isFinite(total) || total <= 0) return 'standard';
  const extra = formatByKey(format)?.extra ?? 0;
  const base = total - extra;
  const match = BOOKING_DEPTHS.find((d) => d.price === base);
  return match?.key ?? 'standard';
}

function normalizeSlot(raw: unknown, panditId: string): Slot | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = str(o.id);
  if (!id) return null;
  const dateRaw =
    str(o.date) ||
    str(o.slot_date) ||
    str(o.slotDate) ||
    (typeof o.starts_at === 'string' ? o.starts_at : '') ||
    (typeof o.startsAt === 'string' ? o.startsAt : '');
  const date = isoDateOnly(dateRaw);
  if (!date) return null;

  return {
    id,
    panditId: str(o.pandit_id ?? o.panditId, panditId),
    date,
    startTime:
      typeof o.start_time === 'string'
        ? o.start_time
        : typeof o.startTime === 'string'
          ? o.startTime
          : null,
    endTime:
      typeof o.end_time === 'string'
        ? o.end_time
        : typeof o.endTime === 'string'
          ? o.endTime
          : null,
    isBooked: bool(o.is_booked ?? o.isBooked, false),
  };
}

function normalizeReview(raw: unknown, bookingIdFallback = ''): Review | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = str(o.id);
  const bookingId = str(o.booking_id ?? o.bookingId, bookingIdFallback);
  const ratingRaw = o.rating;
  const rating =
    typeof ratingRaw === 'number' && Number.isFinite(ratingRaw)
      ? ratingRaw
      : typeof ratingRaw === 'string'
        ? Number(ratingRaw)
        : NaN;
  if (!id || !bookingId || !Number.isFinite(rating)) return null;

  return {
    id,
    bookingId,
    rating,
    comment:
      typeof o.comment === 'string'
        ? o.comment
        : o.comment == null
          ? null
          : String(o.comment),
    createdAt: str(o.created_at ?? o.createdAt, new Date().toISOString()),
  };
}

function normalizeBooking(raw: unknown): Booking | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = str(o.id);
  const panditId = resolvePanditId(o);
  if (!id || !panditId) return null;

  const panditName = resolvePanditName(o);

  const statusRaw = str(o.status, 'pending').toLowerCase();
  const status = (
    ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(statusRaw)
      ? statusRaw
      : 'pending'
  ) as BookingStatus;

  const format = str(o.format);
  const depth = str(o.depth) || inferDepthFromTotal(o.totalPrice ?? o.total_price, format);

  const slotNested = o.slot ?? o.availability_slot;
  const slotNestedRecord = asRecord(slotNested);
  const slotId =
    str(o.slot_id ?? o.slotId) || (slotNestedRecord ? str(slotNestedRecord.id) : '');

  const slotDateRaw = str(o.slotDate ?? o.slot_date);
  let slot = normalizeSlot(slotNested, panditId);
  if (!slot && slotDateRaw) {
    const date = isoDateOnly(slotDateRaw);
    if (date) {
      slot = {
        id: slotId || id,
        panditId,
        date,
        startTime: null,
        endTime: null,
        isBooked: true,
      };
    }
  }

  const reviewNested = o.review ?? o.booking_review;
  const createdAt = str(o.created_at ?? o.createdAt, new Date().toISOString());

  const startTimeRaw =
    str(o.startTime) ||
    str(o.start_time) ||
    (slot?.startTime && /[tT]|^\d{4}-\d{2}-\d{2}/.test(slot.startTime) ? slot.startTime : '');
  const startTime =
    startTimeRaw && !Number.isNaN(new Date(startTimeRaw).getTime()) ? startTimeRaw : null;

  const coinsDeducted = numOrNull(o.coinsDeducted ?? o.coins_deducted);
  const totalPrice = numOrNull(o.totalPrice ?? o.total_price);

  return {
    id,
    userId: str(o.user_id ?? o.userId),
    panditId,
    slotId: slotId || slot?.id || '',
    area: str(o.area),
    depth,
    format,
    status,
    startTime,
    slot,
    review: normalizeReview(reviewNested, id),
    coinsDeducted,
    totalPrice,
    panditName,
    createdAt,
    updatedAt: str(o.updated_at ?? o.updatedAt, createdAt),
  };
}

function unwrapSlotsFromExpertPayload(body: unknown, panditId: string): unknown[] {
  const root = asRecord(body);
  const candidates: unknown[] = [];

  const pushIfArray = (v: unknown) => {
    if (Array.isArray(v)) candidates.push(...v);
  };

  pushIfArray(body);
  if (root) {
    pushIfArray(root.slots);
    pushIfArray(root.availability);
    pushIfArray(root.availability_slots);
    const data = asRecord(root.data);
    if (data) {
      pushIfArray(data.slots);
      pushIfArray(data.availability);
    }
    const expert = asRecord(root.expert ?? data?.expert);
    if (expert) {
      pushIfArray(expert.slots);
      pushIfArray(expert.availability);
    }
  }

  return candidates;
}

function unwrapBooking(payload: unknown): unknown {
  const o = asRecord(payload);
  if (!o) return payload;
  return o.data ?? o.booking ?? payload;
}

function unwrapBookingList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const o = asRecord(payload);
  if (!o) return [];
  if (Array.isArray(o.data)) return o.data;
  if (Array.isArray(o.bookings)) return o.bookings;
  if (Array.isArray(o.items)) return o.items;
  const data = asRecord(o.data);
  if (data) {
    if (Array.isArray(data.bookings)) return data.bookings;
    if (Array.isArray(data.items)) return data.items;
  }
  return [];
}

function isAvailableSlot(slot: Slot): boolean {
  if (slot.isBooked) return false;
  const slotDate = parseSlotDate(slot.date);
  if (!slotDate) return false;
  slotDate.setHours(0, 0, 0, 0);
  return slotDate.getTime() >= startOfTodayLocal().getTime();
}

export type SlotDisplayStatus = 'available' | 'booked';

export type DisplaySlot = {
  startTime: string;
  status: SlotDisplayStatus;
};

function unwrapSlotList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const o = asRecord(payload);
  if (!o) return [];
  if (Array.isArray(o.slots)) return o.slots;
  if (Array.isArray(o.availableSlots)) return o.availableSlots;
  if (Array.isArray(o.available_slots)) return o.available_slots;
  if (Array.isArray(o.allSlots)) return o.allSlots;
  if (Array.isArray(o.all_slots)) return o.all_slots;
  const data = asRecord(o.data);
  if (data) {
    if (Array.isArray(data.slots)) return data.slots;
    if (Array.isArray(data.availableSlots)) return data.availableSlots;
    if (Array.isArray(data.available_slots)) return data.available_slots;
    if (Array.isArray(data.allSlots)) return data.allSlots;
    if (Array.isArray(data.all_slots)) return data.all_slots;
  }
  return [];
}

function normalizeDisplaySlot(raw: unknown): DisplaySlot | null {
  if (typeof raw === 'string') {
    const startTime = raw.trim();
    if (!startTime || Number.isNaN(new Date(startTime).getTime())) return null;
    return { startTime, status: 'available' };
  }
  const o = asRecord(raw);
  if (!o) return null;
  const startTime = str(o.startTime ?? o.start_time);
  if (!startTime || Number.isNaN(new Date(startTime).getTime())) return null;
  const statusRaw = str(o.status, 'available').toLowerCase();
  const status: SlotDisplayStatus = statusRaw === 'booked' ? 'booked' : 'available';
  return { startTime, status };
}

/** `GET /experts/:id/all-slots?date=YYYY-MM-DD&duration=X` — future slots with status. */
export async function getAllSlots(
  panditId: string,
  date: string,
  durationMinutes: number,
): Promise<DisplaySlot[]> {
  const res = await axios.get(
    `${API_BASE}/experts/${encodeURIComponent(panditId)}/all-slots`,
    { params: { date, duration: durationMinutes } },
  );
  return unwrapSlotList(res.data)
    .map(normalizeDisplaySlot)
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date((a as DisplaySlot).startTime).getTime() -
        new Date((b as DisplaySlot).startTime).getTime(),
    ) as DisplaySlot[];
}

/**
 * Loads all slots (available + booked) via `all-slots`.
 * Use `getAllSlots` when you need booked slots for display.
 */
export async function getAvailableSlots(
  panditId: string,
  date: string,
  durationMinutes: number,
): Promise<DisplaySlot[]> {
  return getAllSlots(panditId, date, durationMinutes);
}

/** `GET /experts/:id` — available slots (`isBooked: false`, date on or after today). */
export async function getSlots(panditId: string): Promise<Slot[]> {
  const res = await axios.get(`${API_BASE}/experts/${encodeURIComponent(panditId)}`);
  const rawSlots = unwrapSlotsFromExpertPayload(res.data, panditId);
  const slots = rawSlots
    .map((row) => normalizeSlot(row, panditId))
    .filter(Boolean) as Slot[];
  return slots.filter(isAvailableSlot);
}

/** `POST /bookings` — creates a booking for the authenticated user. */
export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const token = requireAccessToken();
  const res = await axios.post(`${API_BASE}/bookings`, payload, {
    headers: authHeaders(token),
  });
  const booking = normalizeBooking(unwrapBooking(res.data));
  if (!booking) {
    throw new Error('Invalid booking response');
  }
  return booking;
}

/** `GET /bookings` — list of bookings for the authenticated user. */
export async function getUserBookings(): Promise<Booking[]> {
  const token = requireAccessToken();
  const res = await axios.get(`${API_BASE}/bookings`, {
    headers: authHeaders(token),
  });
  return unwrapBookingList(res.data)
    .map(normalizeBooking)
    .filter(Boolean) as Booking[];
}

/** `GET /bookings/:id` — single booking for the authenticated user. */
export async function getBookingById(id: string): Promise<Booking> {
  const token = requireAccessToken();
  const res = await axios.get(`${API_BASE}/bookings/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
  });
  const booking = normalizeBooking(unwrapBooking(res.data));
  if (!booking) {
    throw new Error('Booking not found');
  }
  return booking;
}

/** `PATCH /bookings/:id/reschedule` — move an upcoming confirmed booking (no extra charge). */
export async function rescheduleBooking(id: string, startTime: string): Promise<Booking> {
  const token = requireAccessToken();
  const res = await axios.patch(
    `${API_BASE}/bookings/${encodeURIComponent(id)}/reschedule`,
    { startTime },
    { headers: authHeaders(token) },
  );
  const booking = normalizeBooking(unwrapBooking(res.data));
  if (!booking) {
    throw new Error('Invalid booking response');
  }
  return booking;
}

/** `PATCH /bookings/:id/status` — mark session completed or cancelled. */
export async function updateBookingStatus(
  id: string,
  status: UpdateBookingStatusPayload['status'],
): Promise<Booking> {
  const token = requireAccessToken();
  const res = await axios.patch(
    `${API_BASE}/bookings/${encodeURIComponent(id)}/status`,
    { status },
    { headers: authHeaders(token) },
  );
  const booking = normalizeBooking(unwrapBooking(res.data));
  if (!booking) {
    throw new Error('Invalid booking response');
  }
  return booking;
}

/** `POST /bookings/:id/review` — submit a post-session rating (optional comment). */
export async function submitReview(
  bookingId: string,
  rating: number,
  comment?: string,
): Promise<Review> {
  const token = requireAccessToken();
  const body: SubmitReviewPayload = { rating };
  if (comment != null && comment.trim() !== '') {
    body.comment = comment.trim();
  }
  const res = await axios.post(
    `${API_BASE}/bookings/${encodeURIComponent(bookingId)}/review`,
    body,
    { headers: authHeaders(token) },
  );
  const bodyRaw = res.data;
  const inner =
    asRecord(bodyRaw)?.review ?? asRecord(bodyRaw)?.data ?? unwrapBooking(bodyRaw);
  const review = normalizeReview(inner, bookingId);
  if (!review) {
    throw new Error('Invalid review response');
  }
  return review;
}

function chatNowMessageFromError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: unknown; error?: unknown } | undefined;
    const m = data?.message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) return m.map(String).join(', ');
    if (typeof data?.error === 'string') return data.error;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Could not start chat.';
}

/** `POST /bookings/chat-now` — instant chat booking for an online pandit. */
export async function chatNow(
  panditId: string,
  area: string,
  notes: string | undefined,
  accessToken: string,
): Promise<Booking> {
  const body: { panditId: string; area: string; notes?: string } = { panditId, area };
  if (notes != null && notes.trim() !== '') {
    body.notes = notes.trim();
  }
  try {
    const res = await axios.post(`${API_BASE}/bookings/chat-now`, body, {
      headers: authHeaders(accessToken),
    });
    const booking = normalizeBooking(unwrapBooking(res.data));
    if (!booking) {
      throw new Error('Invalid booking response');
    }
    return booking;
  } catch (err) {
    if (err instanceof Error && err.message === 'Invalid booking response') {
      throw err;
    }
    throw new Error(chatNowMessageFromError(err));
  }
}
