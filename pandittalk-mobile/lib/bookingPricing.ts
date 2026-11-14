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

export type BookingAreaKey = (typeof BOOKING_AREAS)[number]['key'];

export const BOOKING_DEPTHS = [
  { key: 'entry', label: 'Entry', price: 151, minutes: 15, badge: null },
  { key: 'standard', label: 'Standard', price: 301, minutes: 25, badge: 'Most Chosen' as const },
  { key: 'deep', label: 'Deep', price: 501, minutes: 45, badge: null },
] as const;

export type BookingDepthKey = (typeof BOOKING_DEPTHS)[number]['key'];

export const BOOKING_FORMATS = [
  { key: 'audio', label: 'Audio', extra: 0 },
  { key: 'video', label: 'Video', extra: 150 },
] as const;

export type BookingFormatKey = (typeof BOOKING_FORMATS)[number]['key'];

export function depthByKey(key: string) {
  return BOOKING_DEPTHS.find((d) => d.key === key.trim().toLowerCase());
}

export function formatByKey(key: string) {
  return BOOKING_FORMATS.find((f) => f.key === key.trim().toLowerCase());
}

export function areaByKey(key: string) {
  return BOOKING_AREAS.find((a) => a.key === key.trim().toLowerCase());
}

export function computeBookingTotal(depthKey: string, formatKey: string): number {
  const depth = depthByKey(depthKey);
  const format = formatByKey(formatKey);
  if (!depth || !format) return 0;
  return depth.price + format.extra;
}

export function bookingDurationMinutes(depthKey: string): number {
  return depthByKey(depthKey)?.minutes ?? 0;
}

const groupedInr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** Coin counts. Grouped, no rupee sign. */
export function formatCoins(amount: number): string {
  const n = Number.isFinite(amount) ? Math.round(amount) : 0;
  return groupedInr.format(n);
}

/** Session and pack prices. Always includes the rupee sign. */
export function formatRupee(amount: number): string {
  return `₹${formatCoins(amount)}`;
}

/** Grouped number only. Prefer formatCoins or formatRupee at the call site. */
export function formatInr(amount: number): string {
  return formatCoins(amount);
}

/** Effective ₹/min for comparing depths/formats (rounded to nearest rupee). */
export function effectivePerMinuteRate(totalPrice: number, minutes: number): number {
  if (minutes <= 0 || totalPrice <= 0) return 0;
  return Math.round(totalPrice / minutes);
}

export const DEPTH_PRICE_HINT =
  'The price is for the whole session. The per-minute figure is only so you can compare lengths.';

export const DEPTH_SUMMARIES: Record<BookingDepthKey, string> = {
  entry: 'A short answer to one question.',
  standard: 'A typical consultation, with time to talk it through.',
  deep: 'A longer session for a chart or several topics.',
};

/** Session price first, then a comparison rate that is not the charge. */
export function depthOfferCopy(price: number, minutes: number): { session: string; compare: string } {
  const rate = effectivePerMinuteRate(price, minutes);
  return {
    session: `${formatRupee(price)} for ${minutes} minutes`,
    compare: rate > 0 ? `About ${formatRupee(rate)} per minute, to compare lengths` : '',
  };
}

export function formatPerMinuteRate(totalPrice: number, minutes: number): string {
  const rate = effectivePerMinuteRate(totalPrice, minutes);
  if (rate <= 0) return '';
  return `≈ ${formatRupee(rate)}/min`;
}

function titleCaseWord(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function areaDisplayLabel(area: string): string {
  const found = areaByKey(area);
  if (found) return found.label;
  return area
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(titleCaseWord)
    .join(' ');
}

export function depthDisplayLabel(depth: string): string {
  return depthByKey(depth)?.label ?? titleCaseWord(depth);
}

export function formatDisplayLabel(format: string): string {
  return formatByKey(format)?.label ?? titleCaseWord(format);
}
