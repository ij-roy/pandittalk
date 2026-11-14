import type { Router } from 'expo-router';

import type { BookingAreaKey } from '@/lib/bookingPricing';

const MAX_NOTES_LENGTH = 200;

function truncateNotes(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_NOTES_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_NOTES_LENGTH - 1)}…`;
}

function capitalizeSign(sign: string): string {
  if (!sign) return '';
  return sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();
}

export function buildTarotGuidanceNotes(cardName: string): string {
  return truncateNotes(
    `From Tarot reading — cards: ${cardName.trim() || 'unknown'}. Would like deeper interpretation.`,
  );
}

export function buildCompatibilityGuidanceNotes(personA: string, personB: string): string {
  const a = personA.trim() || 'Person 1';
  const b = personB.trim() || 'Person 2';
  return truncateNotes(`From Compatibility — ${a} & ${b}. Would like relationship guidance.`);
}

export function buildDailyHoroscopeGuidanceNotes(sign: string): string {
  return truncateNotes(
    `From Daily Horoscope (${capitalizeSign(sign)}). Would like to discuss today's reading.`,
  );
}

export function buildKundliGuidanceNotes(ascendantSign: string): string {
  const sign = ascendantSign.trim() || 'unknown';
  return truncateNotes(`From Kundli (${sign} ascendant). Would like guidance.`);
}

export function buildDetailedKundliGuidanceNotes(
  ascendantSign: string,
  mahadasha: string,
): string {
  const sign = ascendantSign.trim() || 'unknown';
  const dasha = mahadasha.trim() || 'current period';
  return truncateNotes(`From Detailed Kundli (${sign} / ${dasha}). Would like guidance.`);
}

export function buildDetailedCompatibilityGuidanceNotes(
  personA: string,
  personB: string,
): string {
  const a = personA.trim() || 'Person 1';
  const b = personB.trim() || 'Person 2';
  return truncateNotes(
    `From Detailed Compatibility — ${a} & ${b}. Would like relationship guidance.`,
  );
}

export function buildPalmReadingGuidanceNotes(): string {
  return 'From Palm Reading. Would like deeper interpretation.';
}

export function buildMonthlyHoroscopeGuidanceNotes(sign: string): string {
  return truncateNotes(`From Month Report (${capitalizeSign(sign)}).`);
}

type StartGuidanceFromToolOptions = {
  notes: string;
  area?: BookingAreaKey;
};

export function startGuidanceFromTool(router: Router, options: StartGuidanceFromToolOptions): void {
  const notes = truncateNotes(options.notes);
  router.push({
    pathname: '/guidance/start',
    params: {
      notes,
      ...(options.area ? { area: options.area } : {}),
    },
  });
}
