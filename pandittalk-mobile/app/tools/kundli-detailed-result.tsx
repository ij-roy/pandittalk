import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  findAscendant,
  LagnaSummaryCard,
  PlanetCard,
  sortPlanets,
} from '@/components/kundli/kundliPlanetUi';
import { ToolsStackWalletButton } from '@/components/ToolsStackWalletButton';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BLOG_CARD_BORDER, DANGER_RED, BLACK, GOLD, GREY_LABEL, SUCCESS_GREEN, TEXT_PRIMARY_DARK, WARM_WHITE, WHITE } from '@/constants/Colors';
import {
  normalizeDetailedKundliResponse,
  type DetailedKundliResponse,
} from '@/lib/toolsApi';
import {
  buildDetailedKundliGuidanceNotes,
  startGuidanceFromTool,
} from '@/lib/guidanceFromTool';
import { goToToolsHub } from '@/lib/toolsNavigation';

const LUCKY_ITEMS: { key: keyof DetailedKundliResponse['luckyElements']; label: string }[] = [
  { key: 'number', label: 'Number' },
  { key: 'color', label: 'Color' },
  { key: 'day', label: 'Day' },
  { key: 'gemstone', label: 'Gemstone' },
  { key: 'deity', label: 'Deity' },
];

function parseResultJson(raw: string | string[] | undefined): DetailedKundliResponse | null {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (!text || typeof text !== 'string') return null;
  try {
    return normalizeDetailedKundliResponse(JSON.parse(text));
  } catch {
    return null;
  }
}

export default function KundliDetailedResultScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ resultJson?: string }>();
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null);

  const result = useMemo(() => parseResultJson(params.resultJson), [params.resultJson]);
  const sortedPlanets = useMemo(
    () => (result ? sortPlanets(result.planets) : []),
    [result],
  );
  const ascendant = useMemo(() => findAscendant(sortedPlanets), [sortedPlanets]);

  const togglePlanet = (name: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPlanet((prev) => (prev === name ? null : name));
  };

  const lifeParagraphs = useMemo(() => {
    if (!result?.lifeNarrative) return [];
    return result.lifeNarrative
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [result?.lifeNarrative]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color={BLACK} />
        </TouchableOpacity>
      ),
      headerRight: () => <ToolsStackWalletButton />,
    });
  }, [navigation, router]);

  if (!result || sortedPlanets.length === 0) {
    return (
      <ScreenBackground>
        <View style={styles.fallbackScreen}>
          <Text style={styles.fallbackTitle}>No chart data available</Text>
          <Text style={styles.fallbackSubtitle}>Please generate your Detailed Kundli again.</Text>
          <PremiumButton title="Go Back" size="lg" onPress={() => router.back()} />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
      >
        <Text style={styles.pageSubtitle}>
          {result.firstName} {result.lastName}
        </Text>

        <SectionHeader title="Planet Positions" />
        <Text style={styles.planetHint}>Tap a planet for details</Text>
        <View style={styles.sectionBody}>
          {ascendant ? <LagnaSummaryCard ascendant={ascendant} /> : null}
          {sortedPlanets.map((planet) => (
            <PlanetCard
              key={planet.name}
              planet={planet}
              expanded={expandedPlanet === planet.name}
              onToggle={() => togglePlanet(planet.name)}
            />
          ))}
        </View>

        <SectionHeader title="Your Life Reading ✨" />
        <View style={[styles.narrativeCard, styles.sectionBody]}>
          {lifeParagraphs.length > 0 ? (
            lifeParagraphs.map((paragraph, index) => (
              <Text
                key={`life-${index}`}
                style={[styles.narrativeText, index < lifeParagraphs.length - 1 && styles.paragraphGap]}
              >
                {paragraph}
              </Text>
            ))
          ) : (
            <Text style={styles.narrativeText}>Life reading will appear here once available.</Text>
          )}
        </View>

        <SectionHeader title="Dosha Analysis" />
        <View style={styles.sectionBody}>
          {result.doshas.length > 0 ? (
            result.doshas.map((dosha) => (
              <View key={dosha.name} style={styles.doshaCard}>
                <View style={styles.doshaHeader}>
                  <Text style={styles.doshaName}>{dosha.name}</Text>
                  <View
                    style={[
                      styles.doshaBadge,
                      { backgroundColor: dosha.present ? DANGER_RED : SUCCESS_GREEN },
                    ]}
                  >
                    <Text style={styles.doshaBadgeText}>{dosha.present ? 'Present' : 'Not Present'}</Text>
                  </View>
                </View>
                {dosha.present && dosha.severity ? (
                  <Text style={styles.doshaSeverity}>Severity: {dosha.severity}</Text>
                ) : null}
                {dosha.description ? (
                  <Text style={styles.doshaDescription}>{dosha.description}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Dosha analysis will appear here once available.</Text>
          )}
        </View>

        <SectionHeader title="Current Dasha Period 🪐" />
        <View style={[styles.dashaCard, styles.sectionBody]}>
          <Text style={styles.dashaPrimary}>{result.dasha.mahadasha}</Text>
          <Text style={styles.dashaSecondary}>{result.dasha.antardasha}</Text>
          {result.dasha.endsOn ? (
            <Text style={styles.dashaEnds}>Ends on: {result.dasha.endsOn}</Text>
          ) : null}
          {result.dasha.meaning ? (
            <Text style={styles.dashaMeaning}>{result.dasha.meaning}</Text>
          ) : null}
        </View>

        <SectionHeader title="Your Lucky Elements 🍀" />
        <View style={[styles.luckyGrid, styles.sectionBody]}>
          {LUCKY_ITEMS.map((item) => (
            <View key={item.key} style={styles.luckyCard}>
              <Text style={styles.luckyLabel}>{item.label}</Text>
              <Text style={styles.luckyValue}>{String(result.luckyElements[item.key] || '—')}</Text>
            </View>
          ))}
        </View>

        <SectionHeader title="Remedies & Guidance 🙏" />
        <View style={styles.sectionBody}>
          {result.remedies.length > 0 ? (
            result.remedies.map((remedy, index) => (
              <View key={`${remedy.title}-${index}`} style={styles.remedyCard}>
                <Text style={styles.remedyTitle}>{remedy.title}</Text>
                <Text style={styles.remedyDescription}>{remedy.description}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Remedies will appear here once available.</Text>
          )}
        </View>

        <PremiumButton
          title="Start Guidance Session"
          size="lg"
          onPress={() =>
            startGuidanceFromTool(router, {
              notes: buildDetailedKundliGuidanceNotes(
                ascendant?.sign ?? '',
                result.dasha.mahadasha,
              ),
            })
          }
          style={styles.ctaSpacing}
        />

        <TouchableOpacity
          onPress={() => goToToolsHub(router)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Explore Astrology Tools"
        >
          <Text style={styles.exploreLink}>Explore Astrology Tools</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerBackBtn: {
    paddingLeft: 4,
    paddingRight: 8,
  },
  pageSubtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  planetHint: {
    fontSize: 13,
    color: GREY_LABEL,
    marginBottom: 10,
    marginTop: -4,
  },
  sectionBody: {
    marginBottom: 24,
    gap: 12,
  },
  narrativeCard: {
    backgroundColor: WARM_WHITE,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: BLOG_CARD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  narrativeText: {
    fontSize: 15,
    color: TEXT_PRIMARY_DARK,
    lineHeight: 24,
  },
  paragraphGap: {
    marginBottom: 14,
  },
  doshaCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: BLOG_CARD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  doshaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  doshaName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  doshaBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  doshaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: WHITE,
  },
  doshaSeverity: {
    fontSize: 13,
    fontWeight: '600',
    color: DANGER_RED,
    marginBottom: 6,
  },
  doshaDescription: {
    fontSize: 14,
    color: GREY_LABEL,
    lineHeight: 21,
  },
  dashaCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: BLOG_CARD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dashaPrimary: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 4,
  },
  dashaSecondary: {
    fontSize: 17,
    fontWeight: '600',
    color: GOLD,
    marginBottom: 8,
  },
  dashaEnds: {
    fontSize: 14,
    color: GREY_LABEL,
    marginBottom: 10,
  },
  dashaMeaning: {
    fontSize: 14,
    color: TEXT_PRIMARY_DARK,
    lineHeight: 22,
  },
  luckyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  luckyCard: {
    width: '47%',
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  luckyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: GREY_LABEL,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  luckyValue: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },
  remedyCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: BLOG_CARD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  remedyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 6,
  },
  remedyDescription: {
    fontSize: 14,
    color: GREY_LABEL,
    lineHeight: 21,
  },
  emptyText: {
    fontSize: 14,
    color: GREY_LABEL,
    lineHeight: 21,
  },
  ctaSpacing: {
    marginTop: 8,
    marginBottom: 16,
  },
  exploreLink: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
  },
  fallbackScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackSubtitle: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 24,
  },
});


