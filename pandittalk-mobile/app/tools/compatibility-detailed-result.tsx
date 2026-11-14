import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { ToolsStackWalletButton } from '@/components/ToolsStackWalletButton';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { SectionHeader } from '@/components/ui/SectionHeader';
import {
  BLOG_CARD_BORDER,
  BLACK,
  DANGER_RED,
  GOLD,
  GREY_LABEL,
  HEADER_RULE_GREY,
  SUCCESS_GREEN,
  TEXT_PRIMARY_DARK,
  WARM_WHITE,
  WHITE,
} from '@/constants/Colors';
import {
  buildDetailedCompatibilityGuidanceNotes,
  startGuidanceFromTool,
} from '@/lib/guidanceFromTool';
import {
  normalizeDetailedCompatibilityResponse,
  type DetailedCompatibilityResponse,
} from '@/lib/toolsApi';

const RING_TRACK = HEADER_RULE_GREY;

function parseResultJson(raw: string | string[] | undefined): DetailedCompatibilityResponse | null {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (!text || typeof text !== 'string') return null;
  try {
    return normalizeDetailedCompatibilityResponse(JSON.parse(text));
  } catch {
    return null;
  }
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

type ScoreRingProps = {
  score: number;
  size?: number;
};

function ScoreRing({ score, size = 160 }: ScoreRingProps) {
  const clamped = clampScore(score);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = clamped / 100;
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={RING_TRACK}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={GOLD}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <Text style={styles.ringScoreText}>{clamped}%</Text>
    </View>
  );
}

type NarrativeBlockProps = {
  text: string;
};

function NarrativeBlock({ text }: NarrativeBlockProps) {
  const paragraphs = useMemo(() => splitParagraphs(text), [text]);
  if (paragraphs.length === 0) {
    return <Text style={styles.narrativeText}>Content will appear here once available.</Text>;
  }
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <Text
          key={`para-${index}`}
          style={[styles.narrativeText, index < paragraphs.length - 1 && styles.paragraphGap]}
        >
          {paragraph}
        </Text>
      ))}
    </>
  );
}

export default function CompatibilityDetailedResultScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    resultJson?: string;
    person1Name?: string;
    person2Name?: string;
  }>();

  const result = useMemo(() => parseResultJson(params.resultJson), [params.resultJson]);
  const person1Name = Array.isArray(params.person1Name)
    ? params.person1Name[0] ?? ''
    : params.person1Name ?? '';
  const person2Name = Array.isArray(params.person2Name)
    ? params.person2Name[0] ?? ''
    : params.person2Name ?? '';

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

  if (!result) {
    return (
      <ScreenBackground>
        <View style={styles.fallbackScreen}>
          <Text style={styles.fallbackTitle}>No detailed report available</Text>
          <Text style={styles.fallbackSubtitle}>Please generate your detailed report again.</Text>
          <PremiumButton title="Go Back" size="lg" onPress={() => router.back()} />
        </View>
      </ScreenBackground>
    );
  }

  const score = clampScore(result.score);

  return (
    <ScreenBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
      >
        <Text style={styles.pageSubtitle}>
          {person1Name} & {person2Name}
        </Text>

        <PremiumCard style={styles.scoreCard}>
          <ScoreRing score={score} />
          <Text style={styles.scoreLabel}>Compatibility Score: {score}%</Text>
        </PremiumCard>

        <SectionHeader title="Couple Narrative ✨" />
        <View style={[styles.narrativeCard, styles.sectionBody]}>
          <NarrativeBlock text={result.coupleNarrative} />
        </View>

        <SectionHeader title="Guna Milan" />
        <View style={[styles.narrativeCard, styles.sectionBody]}>
          <NarrativeBlock text={result.gunaMilan} />
        </View>

        <SectionHeader title="Dosha Compatibility" />
        <View style={styles.sectionBody}>
          {result.doshaCompatibility.length > 0 ? (
            result.doshaCompatibility.map((dosha) => (
              <View key={dosha.name} style={styles.doshaCard}>
                <View style={styles.doshaHeader}>
                  <Text style={styles.doshaName}>{dosha.name}</Text>
                  <View
                    style={[
                      styles.doshaBadge,
                      { backgroundColor: dosha.present ? DANGER_RED : SUCCESS_GREEN },
                    ]}
                  >
                    <Text style={styles.doshaBadgeText}>
                      {dosha.present ? 'Present' : 'Not Present'}
                    </Text>
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
            <Text style={styles.emptyText}>Dosha compatibility will appear here once available.</Text>
          )}
        </View>

        <SectionHeader title="Strengths" />
        <View style={[styles.narrativeCard, styles.sectionBody]}>
          <NarrativeBlock text={result.strengths} />
        </View>

        <SectionHeader title="Challenges" />
        <View style={[styles.narrativeCard, styles.sectionBody]}>
          <NarrativeBlock text={result.challenges} />
        </View>

        <SectionHeader title="Emotional Compatibility" />
        <PremiumCard style={styles.sectionBody}>
          <NarrativeBlock text={result.emotionalCompatibility} />
        </PremiumCard>

        <SectionHeader title="Communication" />
        <PremiumCard style={styles.sectionBody}>
          <NarrativeBlock text={result.communication} />
        </PremiumCard>

        <SectionHeader title="Marriage Outlook" />
        <View style={[styles.narrativeCard, styles.sectionBody]}>
          <NarrativeBlock text={result.marriageOutlook} />
        </View>

        <SectionHeader title="Long-term Harmony" />
        <PremiumCard style={styles.sectionBody}>
          <NarrativeBlock text={result.longTermHarmony} />
        </PremiumCard>

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
              notes: buildDetailedCompatibilityGuidanceNotes(person1Name, person2Name),
              area: 'love',
            })
          }
          style={styles.ctaSpacing}
        />
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
    marginBottom: 16,
  },
  scoreCard: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  ringScoreText: {
    position: 'absolute',
    fontSize: 28,
    fontWeight: '700',
    color: GOLD,
  },
  scoreLabel: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    color: GREY_LABEL,
    textAlign: 'center',
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
  remedyCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: BLOG_CARD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  remedyTitle: {
    fontSize: 16,
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
    marginTop: 4,
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
    textAlign: 'center',
    marginBottom: 8,
  },
  fallbackSubtitle: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
});
