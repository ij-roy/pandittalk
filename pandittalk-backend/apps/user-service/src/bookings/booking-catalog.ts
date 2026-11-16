export const BOOKING_AREAS = [
  { key: 'career', label: 'Career' },
  { key: 'love', label: 'Love' },
  { key: 'family', label: 'Family' },
  { key: 'marriage', label: 'Marriage' },
  { key: 'education', label: 'Education' },
  { key: 'health', label: 'Health' },
  { key: 'business', label: 'Business' },
  { key: 'finance', label: 'Finance' },
] as const;

export const BOOKING_DEPTHS = [
  { key: 'entry', label: 'Entry', durationMinutes: 15, basePrice: 151 },
  { key: 'standard', label: 'Standard', durationMinutes: 25, basePrice: 301 },
  { key: 'deep', label: 'Deep', durationMinutes: 45, basePrice: 501 },
] as const;

export const BOOKING_FORMATS = [
  { key: 'chat', label: 'Chat', surcharge: -50 },
  { key: 'audio', label: 'Audio', surcharge: 0 },
  { key: 'video', label: 'Video', surcharge: 150 },
] as const;

export const BOOKING_CATALOG = {
  version: 1,
  sessionModel: 'legacy_timed' as const,
  scheduled: {
    depths: BOOKING_DEPTHS,
    formats: BOOKING_FORMATS,
    bufferMinutes: 5,
    preStartJoinWindowMinutes: 15,
  },
  chatNow: {
    enabled: true,
    durationMinutes: 15,
    totalPrice: 101,
    noShowRefundMinutes: 10,
    maxQueueDepth: 5,
    maxQueueWaitMinutes: 15,
    queueTurnTimeoutSeconds: 60,
  },
  session: {
    gracePeriodSeconds: 90,
    warningSeconds: 300,
    panditReconnectSeconds: 60,
  },
  cancellation: {
    confirmedBeforeStart: 'full_wallet_refund' as const,
    panditNoShow: 'full_wallet_refund' as const,
    panditDisconnect: 'partial_unused_time_wallet_refund' as const,
    refundDestination: 'wallet' as const,
  },
  areas: BOOKING_AREAS,
} as const;

export type BookingDepth = (typeof BOOKING_DEPTHS)[number]['key'];
export type BookingFormat = (typeof BOOKING_FORMATS)[number]['key'];

export type BookingQuote = {
  sessionModel: 'legacy_timed';
  depth: BookingDepth;
  format: BookingFormat;
  durationMinutes: number;
  totalPrice: number;
  coinsDeducted: number;
};

export function calculateBookingQuote(
  depth: BookingDepth,
  format: BookingFormat,
): BookingQuote {
  const depthOption = BOOKING_DEPTHS.find((option) => option.key === depth);
  const formatOption = BOOKING_FORMATS.find((option) => option.key === format);
  if (!depthOption || !formatOption) {
    throw new Error('Unsupported booking option');
  }

  const totalPrice = depthOption.basePrice + formatOption.surcharge;
  return {
    sessionModel: BOOKING_CATALOG.sessionModel,
    depth,
    format,
    durationMinutes: depthOption.durationMinutes,
    totalPrice,
    coinsDeducted: totalPrice,
  };
}

export function durationForDepth(depth: BookingDepth): number {
  const option = BOOKING_DEPTHS.find((item) => item.key === depth);
  if (!option) throw new Error('Unsupported booking option');
  return option.durationMinutes;
}

export function chatNowQuote() {
  return {
    sessionModel: BOOKING_CATALOG.sessionModel,
    depth: 'entry' as const,
    format: 'chat' as const,
    durationMinutes: BOOKING_CATALOG.chatNow.durationMinutes,
    totalPrice: BOOKING_CATALOG.chatNow.totalPrice,
    coinsDeducted: BOOKING_CATALOG.chatNow.totalPrice,
  };
}
