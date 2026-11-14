import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BLOG_CARD_BORDER, GOLD, GREY_LABEL, SHADOW_BLACK, TEXT_PRIMARY_DARK, WHITE } from '@/constants/Colors';
import { housePlainLanguage, planetPlainLanguage } from '@/lib/planetGlossary';
import type { KundliPlanet } from '@/lib/toolsApi';

export const PLANET_ORDER = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Rahu',
  'Ketu',
  'Ascendant',
] as const;

const HOUSE_AREAS: Record<number, string> = {
  1: 'self-image, vitality, and first impressions',
  2: 'finances, family values, and speech',
  3: 'courage, siblings, and communication',
  4: 'home, mother, and emotional foundations',
  5: 'creativity, children, and intellect',
  6: 'health, service, and daily discipline',
  7: 'partnerships, marriage, and public dealings',
  8: 'transformation, longevity, and hidden matters',
  9: 'dharma, fortune, and higher learning',
  10: 'career, reputation, and public life',
  11: 'gains, friendships, and aspirations',
  12: 'spirituality, expenses, and inner retreat',
};

const PLANET_ROLES: Record<string, string> = {
  Sun: 'solar will and leadership',
  Moon: 'emotional mind and intuition',
  Mercury: 'intellect and adaptability',
  Venus: 'love, beauty, and harmony',
  Mars: 'drive, courage, and action',
  Jupiter: 'wisdom, growth, and optimism',
  Saturn: 'discipline, karma, and patience',
  Rahu: 'ambition and unconventional desires',
  Ketu: 'detachment and spiritual insight',
  Ascendant: 'your outward personality and life direction',
};

const LAGNA_MEANINGS: Record<string, string> = {
  mesha: 'You project bold, pioneering energy — direct, courageous, and ready to lead.',
  vrishabha: 'You appear calm and dependable, with a natural affinity for comfort and lasting value.',
  vrishabh: 'You appear calm and dependable, with a natural affinity for comfort and lasting value.',
  mithuna: 'You come across as curious and articulate, adapting easily to new people and ideas.',
  karka: 'You radiate warmth and empathy, making others feel nurtured and understood.',
  simha: 'You carry a confident, magnetic presence that naturally draws attention and respect.',
  kanya: 'You seem thoughtful and precise, with a keen eye for detail and practical improvement.',
  tula: 'You present grace and fairness, seeking balance and harmony in every interaction.',
  vrischika: 'You project intensity and depth — perceptive, resilient, and emotionally powerful.',
  dhanu: 'You appear optimistic and philosophical, with an adventurous spirit and love of learning.',
  makara: 'You convey discipline and ambition, earning trust through reliability and perseverance.',
  kumbha: 'You seem innovative and independent, drawn to ideas that benefit the wider community.',
  meena: 'You radiate compassion and imagination, with a gentle, intuitive understanding of others.',
};

export function formatDegree(degree: number | string): string {
  const text = typeof degree === 'string' ? degree : `${degree}`;
  return text.includes('°') ? text : `${text}°`;
}

function normalizeSignKey(sign: string): string {
  return sign.trim().toLowerCase().replace(/\s+/g, '');
}

export function sortPlanets(planets: KundliPlanet[]): KundliPlanet[] {
  return [...planets].sort((a, b) => {
    const ai = PLANET_ORDER.findIndex((p) => p.toLowerCase() === a.name.trim().toLowerCase());
    const bi = PLANET_ORDER.findIndex((p) => p.toLowerCase() === b.name.trim().toLowerCase());
    const aIdx = ai === -1 ? PLANET_ORDER.length : ai;
    const bIdx = bi === -1 ? PLANET_ORDER.length : bi;
    return aIdx - bIdx;
  });
}

export function findAscendant(planets: KundliPlanet[]): KundliPlanet | null {
  return (
    planets.find((planet) => planet.name.trim().toLowerCase() === 'ascendant') ??
    planets.find((planet) => planet.name.trim().toLowerCase() === 'lagna') ??
    null
  );
}

function getPlanetInterpretation(planet: KundliPlanet): string {
  const area = HOUSE_AREAS[planet.house] ?? 'important life themes';
  const role = PLANET_ROLES[planet.name] ?? 'planetary influence';

  if (planet.name.trim().toLowerCase() === 'ascendant') {
    return `Rising in ${planet.sign}, your Ascendant colors ${area} with a distinctive personal stamp.`;
  }

  return `${planet.name} in ${planet.sign} channels ${role} through House ${planet.house}, shaping ${area}.`;
}

function getLagnaMeaning(sign: string): string {
  const key = normalizeSignKey(sign);
  return (
    LAGNA_MEANINGS[key] ??
    `Your ${sign} Ascendant shapes how you meet the world — influencing first impressions and your natural approach to life.`
  );
}

type LagnaSummaryCardProps = {
  ascendant: KundliPlanet;
};

export function LagnaSummaryCard({ ascendant }: LagnaSummaryCardProps) {
  return (
    <View style={styles.lagnaCard}>
      <Text style={styles.lagnaTitle}>Your Ascendant (Lagna): {ascendant.sign}</Text>
      <Text style={styles.lagnaMeaning}>{getLagnaMeaning(ascendant.sign)}</Text>
    </View>
  );
}

type PlanetCardProps = {
  planet: KundliPlanet;
  expanded: boolean;
  onToggle: () => void;
};

export function PlanetCard({ planet, expanded, onToggle }: PlanetCardProps) {
  const houseMeaning = housePlainLanguage(planet.house);
  return (
    <TouchableOpacity
      style={styles.planetCard}
      onPress={onToggle}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${planet.name}, ${planet.sign}, House ${planet.house}`}
    >
      <View style={styles.planetAccent} />
      <View style={styles.planetContent}>
        <View style={styles.planetHeader}>
          <Text style={styles.planetName}>{planet.name}</Text>
          <Text style={styles.planetSign}>{planet.sign}</Text>
        </View>
        <Text style={styles.planetGlossary}>{planetPlainLanguage(planet.name)}</Text>
        <View style={styles.planetMeta}>
          <Text style={styles.planetMetaText}>
            {houseMeaning ? `House ${planet.house} · ${houseMeaning}` : `House ${planet.house}`}
          </Text>
          <Text style={styles.planetMetaText}>{formatDegree(planet.degree)}</Text>
        </View>
        {expanded ? (
          <Text style={styles.planetInterpretation}>{getPlanetInterpretation(planet)}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  lagnaCard: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: SHADOW_BLACK,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  lagnaTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 6,
  },
  lagnaMeaning: {
    fontSize: 14,
    color: WHITE,
    lineHeight: 20,
    opacity: 0.95,
  },
  planetCard: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: BLOG_CARD_BORDER,
    overflow: 'hidden',
    shadowColor: SHADOW_BLACK,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  planetAccent: {
    width: 5,
    backgroundColor: GOLD,
  },
  planetContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  planetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planetName: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  planetGlossary: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_PRIMARY_DARK,
    marginBottom: 8,
  },
  planetSign: {
    fontSize: 15,
    fontWeight: '600',
    color: GOLD,
  },
  planetMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planetMetaText: {
    fontSize: 14,
    color: GREY_LABEL,
  },
  planetInterpretation: {
    fontSize: 14,
    color: GREY_LABEL,
    lineHeight: 20,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BLOG_CARD_BORDER,
  },
});
