export type SunSign = { key: string; label: string };

export const HOROSCOPE_SIGN_NOTE =
  'This reading uses the sun sign you choose. It does not use birth time or place.';

export const HOROSCOPE_BIRTH_NOTE =
  'A Kundli uses your date, time, and place, and can name a different sign.';

const BY_START: { key: string; label: string; from: number }[] = [
  { key: 'aquarius', label: 'Aquarius', from: 120 },
  { key: 'pisces', label: 'Pisces', from: 219 },
  { key: 'aries', label: 'Aries', from: 321 },
  { key: 'taurus', label: 'Taurus', from: 420 },
  { key: 'gemini', label: 'Gemini', from: 521 },
  { key: 'cancer', label: 'Cancer', from: 621 },
  { key: 'leo', label: 'Leo', from: 723 },
  { key: 'virgo', label: 'Virgo', from: 823 },
  { key: 'libra', label: 'Libra', from: 923 },
  { key: 'scorpio', label: 'Scorpio', from: 1023 },
  { key: 'sagittarius', label: 'Sagittarius', from: 1122 },
  { key: 'capricorn', label: 'Capricorn', from: 1222 },
];

export function sunSignFromMonthDay(month: number, day: number): SunSign | null {
  if (!Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const stamp = month * 100 + day;
  if (stamp >= 1222 || stamp < 120) return { key: 'capricorn', label: 'Capricorn' };
  let match = BY_START[0]!;
  for (const sign of BY_START) {
    if (stamp >= sign.from) match = sign;
  }
  return { key: match.key, label: match.label };
}

export function sunSignFromIsoDate(iso: string): SunSign | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return sunSignFromMonthDay(month, day);
}

export function birthSignHint(sign: SunSign | null): string | null {
  if (!sign) return null;
  return `Your date of birth matches ${sign.label} for this horoscope. A Kundli can still differ.`;
}
