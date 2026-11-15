/** Minimum age for PanditTalk account holders (chat marketplace). */
export const MINIMUM_ACCOUNT_AGE = 18;

const UNDERAGE_MESSAGE = 'You must be 18 or older to use PanditTalk.';

export function underageAccountMessage(): string {
  return UNDERAGE_MESSAGE;
}

/** Parse YYYY-MM-DD (optional time suffix) into a local calendar Date. */
export function parseDobDate(dob: string): Date | null {
  const datePart = dob.includes('T') ? dob.split('T')[0]! : dob.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isAtLeastAge(
  dob: string | Date,
  minAge: number,
  asOf: Date = new Date(),
): boolean {
  const birth =
    typeof dob === 'string'
      ? parseDobDate(dob)
      : new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
  if (!birth) return false;

  let age = asOf.getFullYear() - birth.getFullYear();
  const monthDelta = asOf.getMonth() - birth.getMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && asOf.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return age >= minAge;
}

/** Latest calendar DOB that still satisfies `minAge` on `asOf`. */
export function getMaxDateForMinimumAge(
  minAge: number,
  asOf: Date = new Date(),
): Date {
  const date = new Date(
    asOf.getFullYear() - minAge,
    asOf.getMonth(),
    asOf.getDate(),
  );
  date.setHours(0, 0, 0, 0);
  return date;
}
