import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';

import { EntertainmentDisclaimer } from '@/components/EntertainmentDisclaimer';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { GOLD, GREY_LABEL, HEADER_RULE_GREY, SCRIM_BLACK, TEXT_PRIMARY_DARK } from '@/constants/Colors';
import { presentToolFailure } from '@/lib/presentToolError';
import { postHoroscope } from '@/lib/toolsApi';
import { readHoroscopeStreak, streakLabel, todayKey, visibleStreak } from '@/lib/horoscopeStreak';
import {
  HOROSCOPE_BIRTH_NOTE,
  HOROSCOPE_SIGN_NOTE,
  birthSignHint,
  sunSignFromIsoDate,
} from '@/lib/horoscopePath';
import {
  readSavedHoroscopeSign,
  syncHoroscopeReminder,
} from '@/lib/horoscopeReminderSchedule';
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

const SYMBOL_SIZE = 44;

function ZodiacSymbol({ symbol }: { symbol: string }) {
  return (
    <Svg width={SYMBOL_SIZE} height={SYMBOL_SIZE} viewBox={`0 0 ${SYMBOL_SIZE} ${SYMBOL_SIZE}`}>
      <SvgText
        x={SYMBOL_SIZE / 2}
        y={SYMBOL_SIZE / 2 + 10}
        fontSize={36}
        fill={GOLD}
        textAnchor="middle"
      >
        {symbol}
      </SvgText>
    </Svg>
  );
}

export default function HoroscopeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sign?: string }>();
  const highlighted = Array.isArray(params.sign) ? params.sign[0] : params.sign;
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [streakText, setStreakText] = useState(streakLabel(0));
  const dob = typeof user?.dob === 'string' ? user.dob : '';
  const birthSign = sunSignFromIsoDate(dob);
  const birthHint = birthSignHint(birthSign);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void readHoroscopeStreak().then((state) => {
        if (!cancelled) setStreakText(streakLabel(visibleStreak(state, todayKey())));
      });
      void readSavedHoroscopeSign().then((saved) => {
        if (cancelled) return;
        void syncHoroscopeReminder(saved ?? birthSign?.key ?? null);
      });
      return () => {
        cancelled = true;
      };
    }, [birthSign?.key]),
  );

  const handleSignPress = useCallback(
    async (signKey: string) => {
      setLoading(true);
      try {
        const data = await postHoroscope({ sign: signKey, type: 'daily' });
        router.push({
          pathname: '/tools/horoscope-result',
          params: { resultJson: JSON.stringify(data) },
        });
      } catch (err) {
        presentToolFailure(err, () => void handleSignPress(signKey));
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  return (
    <ScreenBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <EntertainmentDisclaimer compact />
        <Text style={styles.streak}>{streakText}</Text>
        <Text style={styles.subtitle}>{HOROSCOPE_SIGN_NOTE}</Text>
        <Text style={styles.pathNote}>{HOROSCOPE_BIRTH_NOTE}</Text>
        {birthSign ? (
          <TouchableOpacity
            style={styles.birthSignBtn}
            onPress={() => void handleSignPress(birthSign.key)}
            accessibilityRole="button"
            accessibilityLabel={`Use ${birthSign.label} from your date of birth`}
          >
            <Text style={styles.birthSignBtnText}>Use {birthSign.label} from your date of birth</Text>
          </TouchableOpacity>
        ) : null}
        {birthHint ? <Text style={styles.pathNote}>{birthHint}</Text> : null}
        <TouchableOpacity
          onPress={() => router.push('/tools/kundli')}
          accessibilityRole="button"
          accessibilityLabel="Make a birth chart instead"
        >
          <Text style={styles.kundliLink}>Make a birth chart instead</Text>
        </TouchableOpacity>

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
                    style={[
                      styles.cell,
                      highlighted?.toLowerCase() === sign.key && styles.cellHighlighted,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => handleSignPress(sign.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`${sign.label} horoscope`}
                  >
                    <ZodiacSymbol symbol={sign.symbol} />
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  streak: {
    fontSize: 15,
    fontWeight: '600',
    color: GOLD,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  pathNote: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  birthSignBtn: {
    alignSelf: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  birthSignBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },
  kundliLink: {
    fontSize: 15,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
    marginBottom: 20,
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
  cellHighlighted: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  signLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: SCRIM_BLACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

