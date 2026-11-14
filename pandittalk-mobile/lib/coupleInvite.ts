export type CoupleInvite = {
  name: string;
  dob: string;
  time: string;
  place: string;
  coordinates?: string;
};

const INVITE_PREFIX = 'https://www.pandittalk.com/app/compatibility?invite=';

export function encodeCoupleInvite(invite: CoupleInvite): string {
  const payload = JSON.stringify({
    n: invite.name.trim(),
    d: invite.dob,
    t: invite.time,
    p: invite.place.trim(),
    ...(invite.coordinates ? { c: invite.coordinates } : {}),
  });
  return `${INVITE_PREFIX}${encodeURIComponent(payload)}`;
}

export function coupleInviteShareText(name: string, link: string): string {
  const who = name.trim() || 'Your partner';
  return `${who} invited you to a compatibility check. The app fills their birth details. Add yours.\n${link}`;
}

export function decodeCoupleInvite(raw: string): CoupleInvite | null {
  const text = raw.trim();
  if (!text) return null;

  let jsonText = text;
  const marker = 'invite=';
  const markerAt = text.indexOf(marker);
  if (markerAt >= 0) {
    const encoded = text.slice(markerAt + marker.length).split('&')[0] ?? '';
    try {
      jsonText = decodeURIComponent(encoded);
    } catch {
      return null;
    }
  }

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const name = typeof parsed.n === 'string' ? parsed.n.trim() : '';
    const dob = typeof parsed.d === 'string' ? parsed.d : '';
    const time = typeof parsed.t === 'string' ? parsed.t : '';
    const place = typeof parsed.p === 'string' ? parsed.p.trim() : '';
    if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(dob) || !/^\d{2}:\d{2}$/.test(time) || !place) {
      return null;
    }
    const coordinates = typeof parsed.c === 'string' && parsed.c.trim() ? parsed.c.trim() : undefined;
    return { name, dob, time, place, coordinates };
  } catch {
    return null;
  }
}

export function inviteToFormDates(invite: CoupleInvite): { date: Date; time: Date } | null {
  const [year, month, day] = invite.dob.split('-').map(Number);
  const [hours, minutes] = invite.time.split(':').map(Number);
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const date = new Date(year, month - 1, day);
  const time = new Date();
  time.setHours(hours, minutes, 0, 0);
  return { date, time };
}
