export const DAILY_HOROSCOPE_TITLE = 'Daily Horoscope';
export const MONTHLY_HOROSCOPE_TITLE = 'Month Report';

export const MONTHLY_HOROSCOPE_NOTE =
  'This covers the whole month. It is separate from today\'s free horoscope.';

export const MONTHLY_FROM_DAILY_LINK = 'See the month report';

export function dailyHoroscopeReportTitle(signLabel: string): string {
  const sign = signLabel.trim();
  return sign ? `${DAILY_HOROSCOPE_TITLE} — ${sign}` : DAILY_HOROSCOPE_TITLE;
}

export function monthlyHoroscopeReportTitle(signLabel: string): string {
  const sign = signLabel.trim();
  return sign ? `${MONTHLY_HOROSCOPE_TITLE} — ${sign}` : MONTHLY_HOROSCOPE_TITLE;
}
