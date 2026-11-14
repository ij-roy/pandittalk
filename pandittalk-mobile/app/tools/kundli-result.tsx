import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  ScrollView,
  Share,
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
import { PremiumButton } from '@/components/ui/PremiumButton';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { BG, BLOG_CARD_BORDER, GOLD, GREY_LABEL, TEXT_PRIMARY_DARK, WHITE } from '@/constants/Colors';
import { DETAILED_KUNDLI_COST } from '@/components/kundli/kundliComparisonData';
import { detailedUpsellCopy } from '@/lib/detailedUpsell';
import { kundliShareMessage } from '@/lib/kundliShare';
import { canPurchaseDigitalTools } from '@/lib/iosStorePolicy';
import type { KundliPlanet, KundliResponse } from '@/lib/toolsApi';
import { buildKundliGuidanceNotes, startGuidanceFromTool } from '@/lib/guidanceFromTool';


function parseResultJson(raw: string | string[] | undefined): KundliResponse | null {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (!text || typeof text !== 'string') return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as KundliResponse;
    if (!Array.isArray(obj.planets)) return null;
    return {
      chart: obj.chart,
      planets: obj.planets as KundliPlanet[],
      firstName: typeof obj.firstName === 'string' ? obj.firstName : '',
      lastName: typeof obj.lastName === 'string' ? obj.lastName : '',
    };
  } catch {
    return null;
  }
}

function DetailedUpsell({ canBuy, onPress }: { canBuy: boolean; onPress: () => void }) {
  const copy = detailedUpsellCopy(canBuy, DETAILED_KUNDLI_COST);
  return (
    <View style={styles.upsellCard}>
      <Text style={styles.upsellTitle}>{copy.title}</Text>
      <Text style={styles.upsellBody}>{copy.body}</Text>
      <TouchableOpacity
        style={styles.upsellBtn}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={copy.action}
      >
        <Text style={styles.upsellBtnText}>{copy.action}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function KundliResultScreen() {
  const router = useRouter();
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

  if (!result || sortedPlanets.length === 0) {
    return (
      <ScreenBackground>
        <View style={styles.fallbackScreen}>
          <Text style={styles.fallbackTitle}>No chart data available</Text>
          <Text style={styles.fallbackSubtitle}>Please generate your Kundli again.</Text>
          <PremiumButton title="Go Back" size="lg" onPress={() => router.back()} />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 150 }]}
      >
        {ascendant ? <LagnaSummaryCard ascendant={ascendant} /> : null}

        {sortedPlanets.map((planet) => (
          <PlanetCard
            key={planet.name}
            planet={planet}
            expanded={expandedPlanet === planet.name}
            onToggle={() => togglePlanet(planet.name)}
          />
        ))}

        <DetailedUpsell
          canBuy={canPurchaseDigitalTools()}
          onPress={() => {
            if (!canPurchaseDigitalTools()) {
              startGuidanceFromTool(router, {
                notes: buildKundliGuidanceNotes(ascendant?.sign ?? ''),
              });
              return;
            }
            router.push('/tools/kundli-detailed');
          }}
        />
      </ScrollView>

      <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => {
            void Share.share({
              message: kundliShareMessage({
                firstName: result.firstName,
                lastName: result.lastName,
                planets: sortedPlanets,
              }),
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Share this Kundli"
        >
          <Text style={styles.shareBtnText}>Share chart</Text>
        </TouchableOpacity>
        <PremiumButton
          title="Start Guidance Session"
          size="lg"
          onPress={() =>
            startGuidanceFromTool(router, {
              notes: buildKundliGuidanceNotes(ascendant?.sign ?? ''),
            })
          }
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BLOG_CARD_BORDER,
    gap: 10,
  },
  shareBtn: {
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareBtnText: {
    color: TEXT_PRIMARY_DARK,
    fontSize: 16,
    fontWeight: '700',
  },
  upsellCard: {
    marginTop: 8,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: GOLD,
    padding: 16,
    gap: 8,
  },
  upsellTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  upsellBody: {
    fontSize: 14,
    lineHeight: 20,
    color: TEXT_PRIMARY_DARK,
  },
  upsellBtn: {
    marginTop: 4,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upsellBtnText: {
    color: TEXT_PRIMARY_DARK,
    fontSize: 16,
    fontWeight: '700',
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

