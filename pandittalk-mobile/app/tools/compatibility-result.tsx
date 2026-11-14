import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { KundliMandalaSpinner } from '@/components/KundliMandalaSpinner';
import { ToolsStackWalletButton } from '@/components/ToolsStackWalletButton';
import { DETAILED_COMPATIBILITY_COST } from '@/components/kundli/kundliComparisonData';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BG, BLACK, BLOG_CARD_BORDER, GOLD, GREY_LABEL, HEADER_RULE_GREY, TEXT_PRIMARY_DARK } from '@/constants/Colors';
import { ADD_COINS_LABEL, INSUFFICIENT_COINS_TITLE, insufficientCoinsBody } from '@/lib/insufficientCoins';
import {
  buildCompatibilityGuidanceNotes,
  startGuidanceFromTool,
} from '@/lib/guidanceFromTool';
import {
  canPurchaseDigitalTools,
  IOS_DIGITAL_TOOLS_UNAVAILABLE_MESSAGE,
  IOS_DIGITAL_TOOLS_UNAVAILABLE_TITLE,
} from '@/lib/iosStorePolicy';
import {
  postDetailedCompatibility,
  type CompatibilityRequest,
  type CompatibilityResponse,
} from '@/lib/toolsApi';
import { useAuthStore } from '@/store/useAuthStore';

const RING_TRACK = HEADER_RULE_GREY;

function parseResultJson(raw: string | string[] | undefined): CompatibilityResponse | null {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (!text || typeof text !== 'string') return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as CompatibilityResponse;
    if (
      typeof obj.score !== 'number' ||
      typeof obj.emotionalCompatibility !== 'string' ||
      !obj.emotionalCompatibility.trim() ||
      typeof obj.communication !== 'string' ||
      !obj.communication.trim() ||
      typeof obj.longTermHarmony !== 'string' ||
      !obj.longTermHarmony.trim()
    ) {
      return null;
    }
    return obj;
  } catch {
    return null;
  }
}

function parseRequestJson(raw: string | string[] | undefined): CompatibilityRequest | null {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (!text || typeof text !== 'string') return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as CompatibilityRequest;
    if (!obj.person1 || !obj.person2) return null;
    if (
      typeof obj.person1.name !== 'string' ||
      typeof obj.person1.dob !== 'string' ||
      typeof obj.person1.timeOfBirth !== 'string' ||
      typeof obj.person1.placeOfBirth !== 'string' ||
      typeof obj.person2.name !== 'string' ||
      typeof obj.person2.dob !== 'string' ||
      typeof obj.person2.timeOfBirth !== 'string' ||
      typeof obj.person2.placeOfBirth !== 'string'
    ) {
      return null;
    }
    return obj;
  } catch {
    return null;
  }
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

type ScoreRingProps = {
  score: number;
  size?: number;
};

function ScoreRing({ score, size = 180 }: ScoreRingProps) {
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

type SectionProps = {
  emoji: string;
  title: string;
  body: string;
};

function InsightSection({ emoji, title, body }: SectionProps) {
  return (
    <PremiumCard style={styles.section}>
      <SectionHeader title={title} first right={<Text style={styles.sectionEmoji}>{emoji}</Text>} />
      <Text style={styles.sectionBody}>{body}</Text>
    </PremiumCard>
  );
}

export default function CompatibilityResultScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const params = useLocalSearchParams<{
    resultJson?: string;
    requestJson?: string;
    person1Name?: string;
    person2Name?: string;
  }>();

  const result = useMemo(() => parseResultJson(params.resultJson), [params.resultJson]);
  const request = useMemo(() => parseRequestJson(params.requestJson), [params.requestJson]);
  const person1Name = Array.isArray(params.person1Name)
    ? params.person1Name[0] ?? ''
    : params.person1Name ?? '';
  const person2Name = Array.isArray(params.person2Name)
    ? params.person2Name[0] ?? ''
    : params.person2Name ?? '';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <ToolsStackWalletButton />,
    });
  }, [navigation]);

  const generateDetailed = useCallback(async () => {
    if (!request) return;

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    setLoadingDetailed(true);
    try {
      const data = await postDetailedCompatibility(
        { ...request, detailed: true },
        token,
      );
      router.push({
        pathname: '/tools/compatibility-detailed-result',
        params: {
          resultJson: JSON.stringify(data),
          person1Name,
          person2Name,
        },
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        if (msg === 'insufficient_balance') {
          Alert.alert(
            INSUFFICIENT_COINS_TITLE,
            insufficientCoinsBody(
              DETAILED_COMPATIBILITY_COST,
              useAuthStore.getState().walletBalance ?? 0,
            ),
            [
              { text: 'Cancel', style: 'cancel' },
              { text: ADD_COINS_LABEL, onPress: () => router.push('/wallet/recharge') },
            ],
          );
          return;
        }
        if (err.response?.status === 401) {
          Alert.alert('Session expired', 'Please sign in again to continue.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.push('/login') },
          ]);
          return;
        }
      }
      Alert.alert(
        'Report unavailable',
        'We could not generate your detailed report. Your coins have been refunded if charged.',
      );
    } finally {
      setLoadingDetailed(false);
    }
  }, [person1Name, person2Name, request, router]);

  const handleViewDetailed = useCallback(() => {
    if (!request) {
      Alert.alert('Missing details', 'Please run the compatibility check again.');
      return;
    }

    if (!canPurchaseDigitalTools()) {
      Alert.alert(IOS_DIGITAL_TOOLS_UNAVAILABLE_TITLE, IOS_DIGITAL_TOOLS_UNAVAILABLE_MESSAGE, [
        { text: 'OK', style: 'cancel' },
        { text: 'Find Experts', onPress: () => router.push('/(tabs)/experts') },
      ]);
      return;
    }

    const token = useAuthStore.getState().accessToken;
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to view the detailed report.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/login') },
      ]);
      return;
    }

    const currentBalance = useAuthStore.getState().walletBalance ?? 0;
    if (currentBalance < DETAILED_COMPATIBILITY_COST) {
      Alert.alert(
        INSUFFICIENT_COINS_TITLE,
        insufficientCoinsBody(DETAILED_COMPATIBILITY_COST, currentBalance),
        [
          { text: 'Cancel', style: 'cancel' },
          { text: ADD_COINS_LABEL, onPress: () => router.push('/wallet/recharge') },
        ],
      );
      return;
    }

    Alert.alert(
      'Confirm purchase',
      `This detailed report uses ${DETAILED_COMPATIBILITY_COST} coins. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => void generateDetailed() },
      ],
    );
  }, [generateDetailed, request, router]);

  if (!result) {
    return (
      <ScreenBackground>
        <View style={styles.fallbackScreen}>
          <Text style={styles.fallbackTitle}>No compatibility data available</Text>
          <Text style={styles.fallbackSubtitle}>Please check compatibility again.</Text>
          <PremiumButton title="Go Back" size="lg" onPress={() => router.back()} />
        </View>
      </ScreenBackground>
    );
  }

  if (loadingDetailed) {
    return (
      <View style={styles.loadingScreen}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.loadingBackBtn, { top: insets.top + 8 }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color={BLACK} />
        </TouchableOpacity>
        <Text style={styles.loadingTitle}>Generating Detailed Report</Text>
        <KundliMandalaSpinner />
        <Text style={styles.loadingSubtitle}>Preparing your compatibility analysis...</Text>
      </View>
    );
  }

  const score = clampScore(result.score);

  return (
    <ScreenBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 160 }]}
      >
        <Text style={styles.pageTitle}>Compatibility Score</Text>

        <PremiumCard style={styles.scoreCard}>
          <ScoreRing score={score} />
          <Text style={styles.scoreLabel}>Your Compatibility Score: {score}%</Text>
        </PremiumCard>

        <InsightSection
          emoji="❤️"
          title="Emotional Compatibility"
          body={result.emotionalCompatibility}
        />

        <InsightSection emoji="💬" title="Communication" body={result.communication} />

        <PremiumCard style={styles.harmonyCard}>
          <SectionHeader title="Long-term Harmony" first />
          <Text style={styles.harmonyBody}>{result.longTermHarmony}</Text>
        </PremiumCard>
      </ScrollView>

      <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 16 }]}>
        <PremiumButton
          title={`View Detailed Compatibility Report ₹${DETAILED_COMPATIBILITY_COST}`}
          variant="secondary"
          size="lg"
          onPress={handleViewDetailed}
        />

        <PremiumButton
          title="Start Guidance Session"
          size="lg"
          onPress={() =>
            startGuidanceFromTool(router, {
              notes: buildCompatibilityGuidanceNotes(person1Name, person2Name),
              area: 'love',
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
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 20,
  },
  scoreCard: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  ringScoreText: {
    position: 'absolute',
    fontSize: 32,
    fontWeight: '700',
    color: GOLD,
  },
  scoreLabel: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
    color: GREY_LABEL,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionBody: {
    fontSize: 15,
    color: TEXT_PRIMARY_DARK,
    lineHeight: 22,
  },
  harmonyCard: {
    marginBottom: 8,
  },
  harmonyBody: {
    fontSize: 15,
    color: TEXT_PRIMARY_DARK,
    lineHeight: 22,
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
    gap: 12,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingBackBtn: {
    position: 'absolute',
    left: 12,
    padding: 4,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingSubtitle: {
    marginTop: 20,
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    lineHeight: 20,
  },
});
