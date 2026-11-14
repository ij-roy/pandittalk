import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BLOG_CARD_BORDER, BLACK, GOLD, GREY_LABEL, HEADER_RULE_GREY, SCRIM_BLACK, SOFT_YELLOW, TEXT_PRIMARY_DARK, WHITE } from '@/constants/Colors';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ToolsStackWalletButton } from '@/components/ToolsStackWalletButton';
import { presentToolFailure } from '@/lib/presentToolError';
import { isOfflineSubmitError } from '@/lib/toolSubmitError';
import { ADD_COINS_LABEL, INSUFFICIENT_COINS_TITLE, insufficientCoinsBody } from '@/lib/insufficientCoins';
import {
  getUnlockedTools,
  postMonthlyHoroscope,
  unlockTool,
  type MonthlyHoroscopeResponse,
} from '@/lib/toolsApi';
import {
  buildMonthlyHoroscopeGuidanceNotes,
  startGuidanceFromTool,
} from '@/lib/guidanceFromTool';
import { HOROSCOPE_BIRTH_NOTE, HOROSCOPE_SIGN_NOTE } from '@/lib/horoscopePath';
import { MONTHLY_HOROSCOPE_NOTE, MONTHLY_HOROSCOPE_TITLE } from '@/lib/horoscopeNames';
import {
  canPurchaseDigitalTools,
  IOS_DIGITAL_TOOLS_UNAVAILABLE_MESSAGE,
  IOS_DIGITAL_TOOLS_UNAVAILABLE_TITLE,
} from '@/lib/iosStorePolicy';
import { goToToolsHub } from '@/lib/toolsNavigation';
import { useAuthStore } from '@/store/useAuthStore';


const ZODIAC_SIGNS = [
  { label: 'Aries', key: 'aries', symbol: '♈' },
  { label: 'Taurus', key: 'taurus', symbol: '♉' },
  { label: 'Gemini', key: 'gemini', symbol: '♊' },
  { label: 'Cancer', key: 'cancer', symbol: '♋' },
  { label: 'Leo', key: 'leo', symbol: '♌' },
  { label: 'Virgo', key: 'virgo', symbol: '♍' },
  { label: 'Libra', key: 'libra', symbol: '♎' },
  { label: 'Scorpio', key: 'scorpio', symbol: '♏' },
  { label: 'Sagittarius', key: 'sagittarius', symbol: '♐' },
  { label: 'Capricorn', key: 'capricorn', symbol: '♑' },
  { label: 'Aquarius', key: 'aquarius', symbol: '♒' },
  { label: 'Pisces', key: 'pisces', symbol: '♓' },
] as const;

const ZODIAC_ROWS = [
  ZODIAC_SIGNS.slice(0, 3),
  ZODIAC_SIGNS.slice(3, 6),
  ZODIAC_SIGNS.slice(6, 9),
  ZODIAC_SIGNS.slice(9, 12),
] as const;

const SYMBOL_SIZE = 36;
const CIRCLE_SIZE = 56;
const UNLOCK_LABEL = '...Unlock full insights 🔒';

type TeaserConfig = {
  title: string;
  field: keyof Pick<MonthlyHoroscopeResponse, 'career' | 'relationships' | 'health'>;
  icon: keyof typeof Ionicons.glyphMap;
};

const TEASER_SECTIONS: TeaserConfig[] = [
  {
    title: 'Career & Opportunities',
    field: 'career',
    icon: 'briefcase-outline',
  },
  {
    title: 'Relationship Outlook',
    field: 'relationships',
    icon: 'heart-outline',
  },
  {
    title: 'Health & Well-being',
    field: 'health',
    icon: 'leaf-outline',
  },
];

type ReportConfig = {
  title: string;
  field: keyof Pick<
    MonthlyHoroscopeResponse,
    'monthlyOverview' | 'career' | 'relationships' | 'health' | 'keyOpportunities'
  >;
  icon?: keyof typeof Ionicons.glyphMap;
};

const REPORT_SECTIONS: ReportConfig[] = [
  { title: 'Monthly Overview', field: 'monthlyOverview' },
  { title: 'Career & Opportunities', field: 'career', icon: 'briefcase-outline' },
  { title: 'Relationship Outlook', field: 'relationships', icon: 'heart-outline' },
  { title: 'Health & Well-being', field: 'health', icon: 'leaf-outline' },
  { title: 'Key Opportunities', field: 'keyOpportunities', icon: 'star-outline' },
];

function parseSavedResultJson(
  raw: string | string[] | undefined,
): MonthlyHoroscopeResponse | null {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (!text || typeof text !== 'string') return null;
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (
      typeof parsed.monthlyOverview !== 'string' ||
      typeof parsed.career !== 'string' ||
      typeof parsed.relationships !== 'string' ||
      typeof parsed.health !== 'string' ||
      typeof parsed.keyOpportunities !== 'string'
    ) {
      return null;
    }
    return {
      sign: typeof parsed.sign === 'string' ? parsed.sign : '',
      monthlyOverview: parsed.monthlyOverview,
      career: parsed.career,
      relationships: parsed.relationships,
      health: parsed.health,
      keyOpportunities: parsed.keyOpportunities,
    };
  } catch {
    return null;
  }
}

function ZodiacSymbol({ symbol }: { symbol: string }) {
  return (
    <Svg width={SYMBOL_SIZE} height={SYMBOL_SIZE} viewBox={`0 0 ${SYMBOL_SIZE} ${SYMBOL_SIZE}`}>
      <SvgText
        x={SYMBOL_SIZE / 2}
        y={SYMBOL_SIZE / 2 + 8}
        fontSize={28}
        fill={GOLD}
        textAnchor="middle"
      >
        {symbol}
      </SvgText>
    </Svg>
  );
}

type TeaserSectionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

function TeaserSection({ icon, title, body }: TeaserSectionProps) {
  return (
    <PremiumCard style={styles.contentCard}>
      <SectionHeader
        title={title}
        first
        right={<Ionicons name={icon} size={20} color={GOLD} />}
      />
      <View style={styles.fadeWrap}>
        <Text numberOfLines={3} style={styles.sectionText}>
          {body}
        </Text>
        <LinearGradient
          colors={['transparent', WHITE]}
          style={styles.fadeOverlay}
          pointerEvents="none"
        />
      </View>
      <Text style={styles.unlockLabel}>{UNLOCK_LABEL}</Text>
    </PremiumCard>
  );
}

type ReportSectionProps = {
  title: string;
  body: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

function ReportSection({ title, body, icon }: ReportSectionProps) {
  return (
    <PremiumCard style={styles.contentCard}>
      <SectionHeader
        title={title}
        first
        right={icon ? <Ionicons name={icon} size={20} color={GOLD} /> : undefined}
      />
      <Text style={styles.sectionBody}>{body}</Text>
    </PremiumCard>
  );
}

export default function MonthlyHoroscopeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ resultJson?: string; savedUnlocked?: string }>();

  const [result, setResult] = useState<MonthlyHoroscopeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    const savedResult = parseSavedResultJson(params.resultJson);
    const fromSaved = params.savedUnlocked === '1' || params.savedUnlocked === 'true';
    if (!savedResult || !fromSaved) return;
    setResult(savedResult);
    setIsUnlocked(true);
  }, [params.resultJson, params.savedUnlocked]);

  const fromSavedReport =
    params.savedUnlocked === '1' || params.savedUnlocked === 'true';

  const handleBack = useCallback(() => {
    if (fromSavedReport) {
      router.back();
      return;
    }
    if (result) {
      setResult(null);
      return;
    }
    router.back();
  }, [fromSavedReport, result, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: MONTHLY_HOROSCOPE_TITLE,
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleBack}
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
  }, [navigation, handleBack, router]);

  const handleSignPress = useCallback(async (signKey: string) => {
    setLoading(true);
    try {
      const data = await postMonthlyHoroscope({ sign: signKey });
      setResult({ ...data, sign: signKey });

      const token = useAuthStore.getState().accessToken;
      if (token) {
        try {
          const unlocked = await getUnlockedTools(token);
          setIsUnlocked(unlocked.includes('monthly_horoscope'));
        } catch {
          setIsUnlocked(false);
        }
      } else {
        setIsUnlocked(false);
      }
    } catch (err) {
      presentToolFailure(err, () => void handleSignPress(signKey));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUnlock = useCallback(async () => {
    if (!canPurchaseDigitalTools()) {
      Alert.alert(IOS_DIGITAL_TOOLS_UNAVAILABLE_TITLE, IOS_DIGITAL_TOOLS_UNAVAILABLE_MESSAGE, [
        { text: 'OK', style: 'cancel' },
        { text: 'Find Experts', onPress: () => router.push('/(tabs)/experts') },
      ]);
      return;
    }

    const COST = 101;
    const currentBalance = useAuthStore.getState().walletBalance ?? 0;
    const token = useAuthStore.getState().accessToken;

    if (!result) return;

    if (currentBalance < COST) {
      Alert.alert(
        INSUFFICIENT_COINS_TITLE,
        insufficientCoinsBody(COST, currentBalance),
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: ADD_COINS_LABEL,
            onPress: () => router.push({ pathname: '/wallet/recharge', params: { returnTo: '/tools/monthly-horoscope' } }),
          },
        ],
      );
      return;
    }

    setUnlocking(true);
    try {
      await unlockTool('monthly_horoscope', token!, result);
      setIsUnlocked(true);
    } catch (error) {
      if (isOfflineSubmitError(error)) {
        presentToolFailure(error, () => void handleUnlock());
      } else {
        const data = axios.isAxiosError(error) ? error.response?.data : undefined;
        const msg =
          data && typeof data === 'object' && 'message' in data
            ? (data as { message?: unknown }).message
            : undefined;
        if (msg === 'insufficient_balance') {
          Alert.alert(
            INSUFFICIENT_COINS_TITLE,
            insufficientCoinsBody(COST, useAuthStore.getState().walletBalance ?? 0),
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: ADD_COINS_LABEL,
                onPress: () =>
                  router.push({
                    pathname: '/wallet/recharge',
                    params: { returnTo: '/tools/monthly-horoscope' },
                  }),
              },
            ],
          );
        } else {
          Alert.alert(
            'Unlock failed',
            typeof msg === 'string' && msg.trim()
              ? msg
              : 'We could not unlock this report. Your coins have been refunded if they were charged.',
          );
        }
      }
    } finally {
      setUnlocking(false);
    }
  }, [result, router]);

  const scrollPadding = { paddingBottom: insets.bottom + 32 };

  if (result && !isUnlocked) {
    return (
      <ScreenBackground>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, scrollPadding]}
        >
          <Text style={styles.subtitle}>Discover what this month holds for you.</Text>

          {TEASER_SECTIONS.map((section) => (
            <TeaserSection
              key={section.field}
              icon={section.icon}
              title={section.title}
              body={result[section.field]}
            />
          ))}

          <View style={styles.priceRow}>
            <Ionicons name="cash" size={22} color={GOLD} />
            <View style={styles.priceChip}>
              <Text style={styles.priceChipText}>
                Unlock cost: <Text style={styles.priceChipBold}>101 coins</Text>
              </Text>
            </View>
          </View>

          {canPurchaseDigitalTools() ? (
            <>
              <Text style={styles.unlockSubtitle}>
                Unlock the full monthly report for 101 coins.
              </Text>
              <PremiumButton
                title="Unlock Full Report"
                size="lg"
                onPress={handleUnlock}
                loading={unlocking}
              />
            </>
          ) : (
            <>
              <Text style={styles.unlockSubtitle}>{IOS_DIGITAL_TOOLS_UNAVAILABLE_MESSAGE}</Text>
              <PremiumButton
                title="Find Experts"
                size="lg"
                onPress={() => router.push('/(tabs)/experts')}
              />
            </>
          )}
        </ScrollView>

        <Modal visible={loading} transparent animationType="fade" onRequestClose={() => {}}>
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={GOLD} />
          </View>
        </Modal>
      </ScreenBackground>
    );
  }

  if (result && isUnlocked) {
    return (
      <ScreenBackground>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, scrollPadding]}
        >
          <Text style={styles.subtitle}>Your month at a glance</Text>

          {REPORT_SECTIONS.map((section) => (
            <ReportSection
              key={section.field}
              title={section.title}
              body={result[section.field]}
              icon={section.icon}
            />
          ))}

          <PremiumButton
            title="Start Guidance Session"
            size="lg"
            onPress={() =>
              startGuidanceFromTool(router, {
                notes: buildMonthlyHoroscopeGuidanceNotes(result.sign),
              })
            }
            style={styles.reportCta}
          />

          <Text style={styles.disclaimer}>
            Your birth details are used only to generate your chart.
          </Text>

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

  return (
    <ScreenBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, scrollPadding]}
      >
        <Text style={styles.subtitle}>{MONTHLY_HOROSCOPE_NOTE}</Text>
        <Text style={styles.subtitle}>{HOROSCOPE_SIGN_NOTE}</Text>
        <Text style={styles.subtitle}>{HOROSCOPE_BIRTH_NOTE}</Text>

        <PremiumCard padding={4}>
          <View style={styles.grid}>
            {ZODIAC_ROWS.map((row, rowIndex) => (
              <View
                key={row.map((s) => s.key).join('-')}
                style={[styles.row, rowIndex < ZODIAC_ROWS.length - 1 && styles.rowDivider]}
              >
                {row.map((sign) => (
                  <TouchableOpacity
                    key={sign.key}
                    style={styles.cell}
                    activeOpacity={0.75}
                    onPress={() => handleSignPress(sign.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`${sign.label} month report`}
                  >
                    <View style={styles.signCircle}>
                      <ZodiacSymbol symbol={sign.symbol} />
                    </View>
                    <Text style={styles.signLabel}>{sign.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </PremiumCard>
      </ScrollView>

      <Modal visible={loading} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  contentCard: {
    marginBottom: 16,
  },
  reportCta: {
    marginTop: 4,
    marginBottom: 16,
  },
  headerBackBtn: {
    paddingLeft: 4,
    paddingRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  grid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HEADER_RULE_GREY,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
  },
  signLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },
  sectionBody: {
    fontSize: 15,
    color: TEXT_PRIMARY_DARK,
    lineHeight: 22,
  },
  sectionText: {
    fontSize: 15,
    color: TEXT_PRIMARY_DARK,
    lineHeight: 22,
  },
  fadeWrap: {
    overflow: 'hidden',
    maxHeight: 72,
    position: 'relative',
  },
  fadeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 32,
  },
  unlockLabel: {
    color: GOLD,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 8,
  },
  priceChip: {
    backgroundColor: SOFT_YELLOW,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: BLOG_CARD_BORDER,
  },
  priceChipText: {
    fontSize: 14,
    color: TEXT_PRIMARY_DARK,
  },
  priceChipBold: {
    fontWeight: '700',
  },
  unlockSubtitle: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 12,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  exploreLink: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: 8,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: SCRIM_BLACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


