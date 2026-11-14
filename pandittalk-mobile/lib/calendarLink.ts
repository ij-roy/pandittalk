/** Google Calendar template link. Returns null when the start time cannot be parsed. */
export function googleCalendarTemplateUrl(input: {
  title: string;
  startIso: string;
  durationMinutes: number;
  details?: string;
}): string | null {
  const start = new Date(input.startIso);
  if (Number.isNaN(start.getTime())) return null;
  const minutes = Number.isFinite(input.durationMinutes) && input.durationMinutes > 0
    ? input.durationMinutes
    : 30;
  const end = new Date(start.getTime() + minutes * 60_000);
  const stamp = (date: Date) =>
    date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${stamp(start)}/${stamp(end)}`,
  });
  if (input.details?.trim()) params.set('details', input.details.trim());
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
