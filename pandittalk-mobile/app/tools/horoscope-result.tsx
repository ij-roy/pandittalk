import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatTile } from '@/components/ui/StatTile';
import { GOLD, GREY_LABEL, TEXT_PRIMARY_DARK } from '@/constants/Colors';
import { markDailyHoroscopeOpened, streakLabel } from '@/lib/horoscopeStreak';
import { syncHoroscopeReminder } from '@/lib/horoscopeReminderSchedule';
import type { HoroscopeResponse } from '@/lib/toolsApi';
import {
  buildDailyHoroscopeGuidanceNotes,
  startGuidanceFromTool,
} from '@/lib/guidanceFromTool';
import { canPurchaseDigitalTools } from '@/lib/iosStorePolicy';
import { MONTHLY_FROM_DAILY_LINK, MONTHLY_HOROSCOPE_NOTE } from '@/lib/horoscopeNames';


function capitalizeSign(sign: string): string {
  if (!sign) return '';
  return sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();
}

function parseResultJson(raw: string | string[] | undefined): HoroscopeResponse | null {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (!text || typeof text !== 'string') return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as HoroscopeResponse;
    if (
      typeof obj.sign !== 'string' ||
      typeof obj.todayInsight !== 'string' ||
      typeof obj.luckyColor !== 'string' ||
      typeof obj.luckyTime !== 'string' ||
      (typeof obj.luckyNumber !== 'string' && typeof obj.luckyNumber !== 'number')
    ) {
      return null;
    }
    return obj;
  } catch {
    return null;
  }
}

function formatLuckyValue(value: string | number): string {
  return String(value).toUpperCase();
}

export default function HoroscopeResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ resultJson?: string }>();

  const result = useMemo(() => parseResultJson(params.resultJson), [params.resultJson]);
  const [streakText, setStreakText] = useState<string | null>(null);

  useEffect(() => {
    if (!result) return;
    let cancelled = false;
    void markDailyHoroscopeOpened().then((state) => {
      if (!cancelled) setStreakText(streakLabel(state.count));
    });
    void syncHoroscopeReminder(result.sign, { askPermission: true });
    return () => {
      cancelled = true;
    };
  }, [result]);

  if (!result) {
    return (
      <ScreenBackground>
        <View style={styles.fallbackScreen}>
          <Text style={styles.fallbackTitle}>No horoscope data available</Text>
          <Text style={styles.fallbackSubtitle}>Please select your zodiac sign again.</Text>
          <PremiumButton title="Go Back" size="lg" onPress={() => router.back()} />
        </View>
      </ScreenBackground>
    );
  }

  const signLabel = capitalizeSign(result.sign);

  return (
    <ScreenBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
      >
        <Text style={styles.pageTitle}>{signLabel} — Today</Text>
        {streakText ? <Text style={styles.streak}>{streakText}</Text> : null}

        <PremiumCard style={styles.contentCard}>
          <SectionHeader title="Today's Insight" first />
          <Text style={styles.insightText}>{result.todayInsight}</Text>
        </PremiumCard>

        <SectionHeader title="Today's Lucky Indicators" />
        <View style={styles.luckyRow}>
          <StatTile value={formatLuckyValue(result.luckyColor)} label="Lucky Color" />
          <StatTile value={formatLuckyValue(result.luckyTime)} label="Lucky Time" />
          <StatTile value={formatLuckyValue(result.luckyNumber)} label="Lucky Number" />
        </View>

        <PremiumButton
          title="Start Guidance Session"
          size="lg"
          onPress={() =>
            startGuidanceFromTool(router, {
              notes: buildDailyHoroscopeGuidanceNotes(result.sign),
            })
          }
          style={styles.ctaSpacing}
        />

        {canPurchaseDigitalTools() ? (
          <TouchableOpacity
            onPress={() => router.push('/tools/monthly-horoscope')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={MONTHLY_FROM_DAILY_LINK}
          >
            <Text style={styles.monthlyLink}>{MONTHLY_FROM_DAILY_LINK}</Text>
            <Text style={styles.monthlyNote}>{MONTHLY_HOROSCOPE_NOTE}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 6,
  },
  streak: {
    fontSize: 15,
    fontWeight: '600',
    color: GOLD,
    marginBottom: 16,
  },
  contentCard: {
    marginBottom: 8,
  },
  insightText: {
    fontSize: 15,
    color: TEXT_PRIMARY_DARK,
    lineHeight: 22,
  },
  luckyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  ctaSpacing: {
    marginBottom: 16,
  },
  monthlyLink: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: 4,
  },
  monthlyNote: {
    fontSize: 13,
    color: GREY_LABEL,
    textAlign: 'center',
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

