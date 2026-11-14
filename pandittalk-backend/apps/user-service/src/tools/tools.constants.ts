import { lookupCityCoordinates } from './indian-city-coordinates';

export const CITY_COORDINATES: Record<string, string> = {
  delhi: '28.6139,77.2090',
  mumbai: '19.0760,72.8777',
  pune: '18.5204,73.8567',
  jaipur: '26.9124,75.7873',
  ludhiana: '30.9010,75.8573',
  chennai: '13.0827,80.2707',
  kolkata: '22.5726,88.3639',
  hyderabad: '17.3850,78.4867',
  bangalore: '12.9716,77.5946',
  ahmedabad: '23.0225,72.5714',
};

export const CITY_NAMES = Object.keys(CITY_COORDINATES).map(
  (c) => c.charAt(0).toUpperCase() + c.slice(1),
);

/** Resolve user input to a supported city key (legacy 10-city map). */
export function resolveCityKey(placeOfBirth: string): string | null {
  const lower = placeOfBirth.trim().toLowerCase();
  if (lookupCityCoordinates(placeOfBirth)) {
    return lower;
  }
  if (CITY_COORDINATES[lower]) {
    return lower;
  }
  for (const city of Object.keys(CITY_COORDINATES)) {
    if (lower.includes(city)) {
      return city;
    }
  }
  return null;
}

/** Resolve lat,lng string for astro APIs. */
export function resolveCoordinatesFromPlace(
  placeOfBirth: string,
): string | undefined {
  const fromExpanded = lookupCityCoordinates(placeOfBirth);
  if (fromExpanded) return fromExpanded;
  const cityKey = resolveCityKey(placeOfBirth);
  return cityKey ? CITY_COORDINATES[cityKey] : undefined;
}

export function toCityDisplayName(cityKey: string): string {
  return cityKey.charAt(0).toUpperCase() + cityKey.slice(1);
}

export const ZODIAC_SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const;

export const HOROSCOPE_TYPES = ['daily', 'monthly'] as const;

export const PALM_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAJOR_ARCANA = [
  'The Fool',
  'The Magician',
  'The High Priestess',
  'The Empress',
  'The Emperor',
  'The Hierophant',
  'The Lovers',
  'The Chariot',
  'Strength',
  'The Hermit',
  'Wheel of Fortune',
  'Justice',
  'The Hanged Man',
  'Death',
  'Temperance',
  'The Devil',
  'The Tower',
  'The Star',
  'The Moon',
  'The Sun',
  'Judgement',
  'The World',
] as const;

export const TAROT_DECK = [
  'The Fool',
  'The Magician',
  'The High Priestess',
  'The Empress',
  'The Emperor',
  'The Hierophant',
  'The Lovers',
  'The Chariot',
  'Strength',
  'The Hermit',
  'Wheel of Fortune',
  'Justice',
  'The Hanged Man',
  'Death',
  'Temperance',
  'The Devil',
  'The Tower',
  'The Star',
  'The Moon',
  'The Sun',
  'Judgement',
  'The World',
  'Ace of Wands',
  'Two of Wands',
  'Three of Wands',
  'Four of Wands',
  'Five of Wands',
  'Six of Wands',
  'Seven of Wands',
  'Eight of Wands',
  'Nine of Wands',
  'Ten of Wands',
  'Page of Wands',
  'Knight of Wands',
  'Queen of Wands',
  'King of Wands',
  'Ace of Cups',
  'Two of Cups',
  'Three of Cups',
  'Four of Cups',
  'Five of Cups',
  'Six of Cups',
  'Seven of Cups',
  'Eight of Cups',
  'Nine of Cups',
  'Ten of Cups',
  'Page of Cups',
  'Knight of Cups',
  'Queen of Cups',
  'King of Cups',
  'Ace of Swords',
  'Two of Swords',
  'Three of Swords',
  'Four of Swords',
  'Five of Swords',
  'Six of Swords',
  'Seven of Swords',
  'Eight of Swords',
  'Nine of Swords',
  'Ten of Swords',
  'Page of Swords',
  'Knight of Swords',
  'Queen of Swords',
  'King of Swords',
  'Ace of Pentacles',
  'Two of Pentacles',
  'Three of Pentacles',
  'Four of Pentacles',
  'Five of Pentacles',
  'Six of Pentacles',
  'Seven of Pentacles',
  'Eight of Pentacles',
  'Nine of Pentacles',
  'Ten of Pentacles',
  'Page of Pentacles',
  'Knight of Pentacles',
  'Queen of Pentacles',
  'King of Pentacles',
] as const;
