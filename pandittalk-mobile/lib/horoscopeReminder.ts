const SIGN_LABELS: Record<string, string> = {
  aries: 'Aries',
  taurus: 'Taurus',
  gemini: 'Gemini',
  cancer: 'Cancer',
  leo: 'Leo',
  virgo: 'Virgo',
  libra: 'Libra',
  scorpio: 'Scorpio',
  sagittarius: 'Sagittarius',
  capricorn: 'Capricorn',
  aquarius: 'Aquarius',
  pisces: 'Pisces',
};

export function horoscopeSignLabel(signKey: string | null | undefined): string | null {
  if (!signKey) return null;
  return SIGN_LABELS[signKey.trim().toLowerCase()] ?? null;
}

/** Local daily reminder. Names the sun sign when we know it. */
export function horoscopeReminderCopy(signKey: string | null | undefined): {
  title: string;
  body: string;
} | null {
  const label = horoscopeSignLabel(signKey);
  if (!label) return null;
  return {
    title: `${label} today`,
    body: `Your ${label} horoscope is ready.`,
  };
}
