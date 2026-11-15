/** Indian mobile E.164: +91 followed by 10 digits starting 6–9. */
export const INDIA_MOBILE_E164_REGEX = /^\+91[6-9]\d{9}$/;

/**
 * Normalize common India mobile inputs to canonical E.164 (`+91##########`).
 * Returns null when the value cannot be a valid Indian mobile number.
 */
export function normalizeIndiaPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (INDIA_MOBILE_E164_REGEX.test(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, '');
  let national: string | null = null;

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    national = digits;
  } else if (
    digits.length === 12 &&
    digits.startsWith('91') &&
    /^[6-9]/.test(digits.slice(2))
  ) {
    national = digits.slice(2);
  } else if (
    digits.length === 11 &&
    digits.startsWith('0') &&
    /^[6-9]/.test(digits.slice(1))
  ) {
    national = digits.slice(1);
  }

  if (!national) {
    return null;
  }

  return `+91${national}`;
}
