const PLANET_GLOSSARY: Record<string, string> = {
  sun: 'Confidence, and how you want to be seen.',
  surya: 'Confidence, and how you want to be seen.',
  moon: 'Feelings, and what makes you feel safe.',
  chandra: 'Feelings, and what makes you feel safe.',
  mercury: 'How you think, learn, and explain things.',
  budha: 'How you think, learn, and explain things.',
  venus: 'What you enjoy, and how you show care.',
  shukra: 'What you enjoy, and how you show care.',
  mars: 'Energy for action, and how you handle conflict.',
  mangal: 'Energy for action, and how you handle conflict.',
  mangala: 'Energy for action, and how you handle conflict.',
  jupiter: 'Where you look for meaning, growth, and good advice.',
  guru: 'Where you look for meaning, growth, and good advice.',
  brihaspati: 'Where you look for meaning, growth, and good advice.',
  saturn: 'Lessons that take time, and work that builds trust.',
  shani: 'Lessons that take time, and work that builds trust.',
  rahu: 'A strong pull toward something new or unfinished.',
  ketu: 'What you are ready to release, or already know quietly.',
  ascendant: 'The first impression you give, and how you start things.',
  lagna: 'The first impression you give, and how you start things.',
};

const HOUSE_GLOSSARY: Record<number, string> = {
  1: 'who you are',
  2: 'money, family, and speech',
  3: 'courage, siblings, and messages',
  4: 'home and emotional roots',
  5: 'creativity, children, and study',
  6: 'health and daily work',
  7: 'marriage and partnerships',
  8: 'change and what stays private',
  9: 'belief, luck, and learning',
  10: 'career and reputation',
  11: 'friends, gains, and hopes',
  12: 'rest, cost, and inner life',
};

function planetKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '');
}

/** Everyday meaning for a chart planet name, including common Sanskrit labels. */
export function planetPlainLanguage(name: string): string {
  return (
    PLANET_GLOSSARY[planetKey(name)] ??
    'One part of the chart. Tap for how it sits in your life.'
  );
}

/** Short house meaning, without astrology jargon. */
export function housePlainLanguage(house: number): string | null {
  return HOUSE_GLOSSARY[house] ?? null;
}
